import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

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

  constructor(private apiService: ApiService) {}

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
        let isDone = false;
        while (!isDone) {
          const { done, value } = await reader.read();
          isDone = done;
          if (value) {
            const chunkText = decoder.decode(value, { stream: true });
            // SSE chunks might contain multiple 'data: {...}' lines
            const lines = chunkText.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.replace('data: ', '').trim();
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
