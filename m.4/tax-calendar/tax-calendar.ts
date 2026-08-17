import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

interface CalendarEvent {
  title: string;
  date: string; // YYYY-MM-DD
  type: string;  // 'Reminder' | 'Payment'
  description: string;
}

interface GroupedMonth {
  monthName: string; // e.g. "June 2025"
  events: CalendarEvent[];
}

@Component({
  selector: 'app-tax-calendar',
  imports: [RouterLink, CommonModule],
  templateUrl: './tax-calendar.html',
  styleUrl: './tax-calendar.css'
})
export class TaxCalendar implements OnInit {
  userName = 'Freelancer';
  isLightTheme = false;
  isLoading = false;
  errorMessage = '';
  groupedMonths: GroupedMonth[] = [];

  // Default mock calendar events
  private fallbackEvents: CalendarEvent[] = [
    {
      title: 'Q2 Estimated Tax Reminder',
      date: '2025-06-01',
      type: 'Reminder',
      description: 'Reminder for upcoming estimated tax payment.'
    },
    {
      title: 'Q2 Estimated Tax Payment',
      date: '2025-06-15',
      type: 'Payment',
      description: 'Second quarter estimated tax payment due.'
    },
    {
      title: 'Q3 Estimated Tax Reminder',
      date: '2025-09-01',
      type: 'Reminder',
      description: 'Reminder for upcoming quarterly payment.'
    },
    {
      title: 'Q3 Estimated Tax Payment',
      date: '2025-09-15',
      type: 'Payment',
      description: 'Third quarter estimated tax payment due.'
    }
  ];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.fullName || 'Freelancer';
      } catch (e) {
        console.error('Error parsing user storage:', e);
      }
    }

    this.loadCalendarEvents();
  }

  loadCalendarEvents() {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.api.getTaxCalendar().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        let events: CalendarEvent[] = [];
        if (Array.isArray(res)) {
          events = res;
        } else if (res && Array.isArray(res.data)) {
          events = res.data;
        } else {
          // If response structure doesn't match, use mock data
          events = this.fallbackEvents;
        }
        
        // If empty list, use mock data to display something
        if (events.length === 0) {
          events = this.fallbackEvents;
        }

        this.processAndGroupEvents(events);
      },
      error: (err: any) => {
        // Log error and fall back to local mock data gracefully
        console.warn('API error fetching tax calendar events, using mock data fallback:', err);
        this.isLoading = false;
        this.processAndGroupEvents(this.fallbackEvents);
      }
    });
  }

  private processAndGroupEvents(events: CalendarEvent[]) {
    // Sort events chronologically
    const sorted = [...events].sort((a, b) => {
      const timeA = new Date(a.date).getTime();
      const timeB = new Date(b.date).getTime();
      return timeA - timeB;
    });

    const groupsMap = new Map<string, CalendarEvent[]>();

    sorted.forEach(evt => {
      const monthYear = this.getMonthYearKey(evt.date);
      if (!groupsMap.has(monthYear)) {
        groupsMap.set(monthYear, []);
      }
      groupsMap.get(monthYear)!.push(evt);
    });

    this.groupedMonths = Array.from(groupsMap.entries()).map(([monthName, monthEvents]) => ({
      monthName,
      events: monthEvents
    }));
  }

  // Format YYYY-MM-DD into "Month Day, Year" in a timezone-independent manner
  formatDateDisplay(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    return dateStr;
  }

  // Convert YYYY-MM-DD into "Month YYYY"
  private getMonthYearKey(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const date = new Date(year, month, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return 'Unknown Month';
  }

  toggleTheme() {
    this.isLightTheme = !this.isLightTheme;
    if (this.isLightTheme) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
