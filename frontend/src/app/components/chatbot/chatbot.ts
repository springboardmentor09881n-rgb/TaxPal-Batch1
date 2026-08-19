import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router, NavigationEnd } from '@angular/router';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent implements OnInit {
  isOpen = signal(false);
  isSidebarOpen = signal(false);
  isLoading = signal(false);
  messages = signal<ChatMessage[]>([]);
  userInput = signal('');
  sessions = signal<any[]>([]);
  currentSessionId = signal<string | null>(null);
  currentUrl = signal('');

  suggestionChips = computed(() => {
    const url = this.currentUrl() || this.router.url || '';
    
    if (url.includes('/tax-estimator')) {
      return [
        { label: 'Quarterly Tax', question: 'What is my estimated tax for this quarter?' },
        { label: 'Tax Deductions', question: 'Explain home office calculation rules and standard mileage deductions.' },
        { label: 'Effective Rate', question: 'What is my current effective tax rate?' },
        { label: 'PDF Breakdown', question: 'Please generate my quarterly tax calculation breakdown.' }
      ];
    }
    
    if (url.includes('/transactions')) {
      return [
        { label: 'Recent Transactions', question: 'What were my last 5 transactions?' },
        { label: 'Spending Categories', question: 'Show me my expenses broken down by category.' },
        { label: 'Unusual Transactions', question: 'Were there any unusual transactions recently?' },
        { label: 'Export Transactions', question: 'Generate a CSV report of my recent transactions.' }
      ];
    }
    
    if (url.includes('/budgets')) {
      return [
        { label: 'Food Budget', question: 'What is my current budget for Food?' },
        { label: 'Overspending Check', question: 'Am I overspending my budgets based on recent transactions?' },
        { label: 'Remaining Balance', question: 'How much remaining balance do I have in my category budgets?' },
        { label: 'Budget Advice', question: 'Give me tips on how to stay within my monthly budgets.' }
      ];
    }
    
    if (url.includes('/reports')) {
      return [
        { label: 'P&L Statement', question: 'Please generate my Profit & Loss (P&L) Statement.' },
        { label: 'Schedule C', question: 'Generate a Schedule C (Form 1040) Tax Summary.' },
        { label: 'Recent Reports', question: 'Show me a list of my recently generated financial reports.' },
        { label: 'Export CSV', question: 'Generate a CSV summary report of my transactions.' }
      ];
    }
    
    return [
      { label: 'Income Check', question: 'How much income did I earn recently?' },
      { label: 'Food Budget', question: 'What is my Food budget?' },
      { label: 'Tax Estimate', question: 'What is my estimated tax for this quarter?' },
      { label: 'Am I Overspending?', question: 'Am I overspending?' }
    ];
  });

  formatSessionTime(timeStr: string): string {
    if (!timeStr) return '';
    try {
      const date = new Date(timeStr);
      const now = new Date();
      
      const isToday = date.toDateString() === now.toDateString();
      const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      if (isToday) {
        return `Today, ${time}`;
      } else {
        const datePart = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${datePart}, ${time}`;
      }
    } catch (e) {
      return '';
    }
  }

  parseMessageContent(content: string): string {
    if (!content) return '';
    
    let escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    escaped = escaped.replace(/\n/g, '<br/>');

    const categories = [
      'Business', 'Office Supplies', 'Software/Tools', 'Professional Services',
      'Travel', 'Education', 'Insurance', 'Utilities', 'Rent', 'Marketing',
      'Equipment', 'Hardware/Gadgets', 'Subscriptions', 'Food', 'Entertainment',
      'Groceries', 'Salary', 'Freelance', 'Investments'
    ];
    
    categories.forEach(cat => {
      const regex = new RegExp(`\\b(${cat})\\b`, 'gi');
      escaped = escaped.replace(regex, (match) => {
        const isBudgetCat = ['Food', 'Rent', 'Utilities', 'Business', 'Travel', 'Entertainment'].includes(cat);
        const targetPath = isBudgetCat ? '/budgets' : '/transactions';
        return `<a href="${targetPath}" class="chat-deep-link" style="color: #6366f1; font-weight: 600; text-decoration: underline;">${match}</a>`;
      });
    });

    return escaped;
  }

  clearAllHistory() {
    if (confirm('Are you sure you want to permanently clear all chat history?')) {
      this.apiService.deleteChatSession('history').subscribe({
        next: () => {
          this.startNewChat();
          this.loadSessions();
        },
        error: (err) => {
          console.error('Failed to clear all history:', err);
          alert('Failed to clear all history. Please try again.');
        }
      });
    }
  }

  constructor(private apiService: ApiService, private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects);
        // Automatically close chatbot on navigation
        this.isOpen.set(false);
      }
    });
  }

  shouldShow(): boolean {
    const url = this.currentUrl() || this.router.url;
    // Hide on login (root or /login) and signup pages
    return url !== '/' && !url.startsWith('/?') && !url.includes('/login') && !url.includes('/signup');
  }

  ngOnInit() {
    this.loadSessions();
    this.startNewChat();
  }

  toggleChat() {
    this.isOpen.update(v => !v);
    if (!this.isOpen()) {
      this.isSidebarOpen.set(false);
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  loadSessions() {
    this.apiService.getChatSessions().subscribe({
      next: (res: any) => {
        this.sessions.set(res.sessions || []);
      },
      error: (err) => console.error('Failed to load chat sessions:', err)
    });
  }

  startNewChat() {
    this.currentSessionId.set(null);
    this.messages.set([{ role: 'model', content: 'Hello! I am your TaxPal AI Assistant. How can I help you manage your finances today?' }]);
    this.isSidebarOpen.set(false);
  }

  loadSession(sessionId: string) {
    this.isLoading.set(true);
    this.apiService.getChatHistory(sessionId).subscribe({
      next: (res: any) => {
        this.currentSessionId.set(sessionId);
        if (res.messages && res.messages.length > 0) {
          this.messages.set(res.messages);
        } else {
          this.messages.set([{ role: 'model', content: 'Hello! I am your TaxPal AI Assistant. How can I help you manage your finances today?' }]);
        }
        this.isLoading.set(false);
        this.isSidebarOpen.set(false);
      },
      error: () => {
        this.startNewChat();
        this.isLoading.set(false);
      }
    });
  }

  deleteSession(sessionId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    if (confirm('Are you sure you want to permanently delete this chat session?')) {
      this.apiService.deleteChatSession(sessionId).subscribe({
        next: () => {
          if (this.currentSessionId() === sessionId) {
            this.startNewChat();
          }
          this.loadSessions();
        },
        error: (err) => {
          console.error('Failed to clear history:', err);
          alert('Failed to clear history. Please try again.');
        }
      });
    }
  }

  sendPrebuiltMessage(question: string) {
    if (this.isLoading()) return;
    this.userInput.set(question);
    this.sendMessage();
  }

  async sendMessage() {
    const text = this.userInput().trim();
    if (!text) return;

    // Add user message
    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.userInput.set('');
    this.isLoading.set(true);

    try {
      const response = await this.apiService.sendChatStream(text, this.currentSessionId());
      if (!response.ok) {
        let errorMsg = 'Sorry, I encountered an error. Please try again.';
        try {
          const errData = await response.json();
          errorMsg = errData.message || errorMsg;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      this.isLoading.set(false);
      // Append an empty model message placeholder
      this.messages.update(msgs => [...msgs, { role: 'model', content: '' }]);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (reader) {
        let buffer = '';
        let isDone = false;
        while (!isDone) {
          const { done, value } = await reader.read();
          isDone = done;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            
            // Split the buffer by double newline (SSE event boundary)
            const parts = buffer.split('\n\n');
            
            // Keep the last partial line/event in the buffer
            buffer = parts.pop() || '';
            
            for (const part of parts) {
              const lines = part.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.substring(6).trim();
                  if (dataStr) {
                    try {
                      const parsed = JSON.parse(dataStr);
                      if (parsed.sessionId) {
                        this.currentSessionId.set(parsed.sessionId);
                        this.loadSessions(); // Refresh list to show new session
                      } else if (parsed.end) {
                        // Process report generation intercept
                        this.messages.update(msgs => {
                          const newMsgs = [...msgs];
                          let content = newMsgs[newMsgs.length - 1].content;
                          
                          const reportMatch = content.match(/\[ACTION:\s*GENERATE_REPORT(?::(PDF|CSV))?\]/i);
                          if (reportMatch) {
                            const format = (reportMatch[1] || 'PDF').toUpperCase();
                            newMsgs[newMsgs.length - 1].content = content.replace(reportMatch[0], '').trim() || `Generating your report in ${format} format...`;
                            setTimeout(() => this.generateAndDownloadReport(format), 100);
                          }
                          return newMsgs;
                        });
                      } else if (parsed.text) {
                        this.messages.update(msgs => {
                          const newMsgs = [...msgs];
                          newMsgs[newMsgs.length - 1].content += parsed.text;
                          return newMsgs;
                        });
                      }
                    } catch(e) {
                      // Ignore broken JSON from chunk splits
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      this.messages.update(msgs => [...msgs, { role: 'model', content: err.message || 'Sorry, I encountered an error. Please try again.' }]);
      this.isLoading.set(false);
    }
  }

  generateAndDownloadReport(format: string = 'PDF') {
    this.messages.update(msgs => [...msgs, { role: 'model', content: `Generating a new financial report for you in ${format} format...` }]);
    this.isLoading.set(true);
    
    // Create a generic monthly financial report
    const reportData = {
      reportType: 'Income Statement',
      period: 'Monthly',
      format: format
    };

    this.apiService.generateReport(reportData).subscribe({
      next: (reportRes: any) => {
        const reportId = reportRes.data._id || reportRes.data.id;
        if (!reportId) {
          this.messages.update(msgs => [...msgs, { role: 'model', content: 'Failed to retrieve report ID.' }]);
          this.isLoading.set(false);
          return;
        }

        this.apiService.downloadReport(reportId, format).subscribe({
          next: (blob: Blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `TaxPal_Financial_Report.${format.toLowerCase()}`;
            a.click();
            window.URL.revokeObjectURL(url);
            
            this.messages.update(msgs => [...msgs, { role: 'model', content: 'Your report has been successfully downloaded!' }]);
            this.isLoading.set(false);
          },
          error: () => {
            this.messages.update(msgs => [...msgs, { role: 'model', content: 'Failed to download the generated report.' }]);
            this.isLoading.set(false);
          }
        });
      },
      error: () => {
        this.messages.update(msgs => [...msgs, { role: 'model', content: 'Failed to generate report on the server.' }]);
        this.isLoading.set(false);
      }
    });
  }
}
