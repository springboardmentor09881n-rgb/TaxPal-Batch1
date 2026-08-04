import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-tax-estimator',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './tax-estimator.html',
  styleUrl: './tax-estimator.css'
})
export class TaxEstimator implements OnInit {
  // Page Navigation State
  activeTab: 'calculator' | 'calendar' = 'calculator';

  // Theme & User Settings
  isLightTheme = false;
  userName = 'Freelancer';
  errorMessage = '';
  isLoading = false;

  // Form Parameters
  selectedCountry = 'United States';
  selectedFilingStatus = 'Single';
  selectedQuarter = 'Q1'; // maps to Q2 (Apr-Jun 2025)

  grossIncome = 0;
  businessExpenses = 0;
  retirementContribution = 0;
  healthInsurance = 0;
  homeOfficeDeduction = 0;

  // Calculation Results
  calculationResult: any = null;
  isCalculating = false;

  // History & List
  estimatesHistory: any[] = [];
  calendarGroups: any[] = [];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Sync theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
    }

    // Sync user details
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.fullName || 'Freelancer';
      } catch (e) {
        console.error('Error parsing user storage:', e);
      }
    }

    this.loadEstimates();
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

  toggleTab(tab: 'calculator' | 'calendar') {
    this.activeTab = tab;
  }

  loadEstimates() {
    this.isLoading = true;
    this.errorMessage = '';
    this.api.getTaxEstimates().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.data) {
          this.estimatesHistory = res.data;
          this.generateCalendarGroups();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error loading estimates:', err);
        if (err.status === 401) {
          this.logout();
        } else {
          this.errorMessage = 'Failed to load tax estimates. Please try again.';
        }
      }
    });
  }

  calculateEstimatedTax() {
    if (this.grossIncome <= 0) {
      alert('Please enter a gross income greater than 0');
      return;
    }

    this.isCalculating = true;
    this.errorMessage = '';

    const payload = {
      country: this.selectedCountry,
      quarter: this.selectedQuarter, // Sends Q1, Q2, Q3, or Q4
      grossIncomeForQuarter: Number(this.grossIncome),
      businessExpenses: Number(this.businessExpenses),
      retirementContribution: Number(this.retirementContribution),
      healthInsurancePremiums: Number(this.healthInsurance),
      homeOfficeDeduction: Number(this.homeOfficeDeduction),
      filingStatus: this.selectedFilingStatus
    };

    this.api.createTaxEstimate(payload).subscribe({
      next: (res: any) => {
        this.isCalculating = false;
        if (res && res.data) {
          this.calculationResult = res.data;
          this.loadEstimates();
        }
      },
      error: (err: any) => {
        this.isCalculating = false;
        console.error('Error calculating tax:', err);
        alert(err?.error?.message || 'Failed to calculate advanced tax. Please try again.');
      }
    });
  }

  deleteEstimate(id: string) {
    if (confirm('Are you sure you want to delete this tax estimate?')) {
      this.api.deleteTaxEstimate(id).subscribe({
        next: () => {
          if (this.calculationResult && this.calculationResult._id === id) {
            this.calculationResult = null;
          }
          this.loadEstimates();
        },
        error: (err: any) => {
          console.error('Error deleting estimate:', err);
          alert('Failed to delete tax estimate. Please try again.');
        }
      });
    }
  }

  // Mappings and UI helpers
  getUIQuarterLabel(quarter: string): string {
    if (quarter === 'Q1') return 'Q2 (Apr-Jun)';
    if (quarter === 'Q2') return 'Q3 (Jul-Sep)';
    if (quarter === 'Q3') return 'Q4 (Oct-Dec)';
    if (quarter === 'Q4') return 'Q1 (Jan-Mar)';
    return quarter;
  }

  getUIQuarterWord(quarter: string): string {
    if (quarter === 'Q1') return 'Second';
    if (quarter === 'Q2') return 'Third';
    if (quarter === 'Q3') return 'Fourth';
    if (quarter === 'Q4') return 'First';
    return quarter;
  }

  formatDate(dateInput: any): string {
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    });
  }

  getCurrencySymbol(country: string): string {
    const c = (country || '').trim().toLowerCase();
    if (c === 'india' || c === 'in') return '₹';
    if (c === 'japan' || c === 'jp' || c === 'china' || c === 'cn') return '¥';
    if (c === 'germany' || c === 'de' || c === 'france' || c === 'fr') return '€';
    if (c === 'united kingdom' || c === 'uk' || c === 'gb' || c === 'united kingdom') return '£';
    if (c === 'switzerland' || c === 'ch') return 'CHF';
    if (c === 'singapore' || c === 'sg') return 'S$';
    return '$';
  }

  formatCurrency(amount: number): string {
    const symbol = this.getCurrencySymbol(this.selectedCountry);
    return symbol + ' ' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatCurrencyWithCountry(amount: number, country: string): string {
    const symbol = this.getCurrencySymbol(country);
    return symbol + ' ' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  generateCalendarGroups() {
    const events: any[] = [];

    this.estimatesHistory.forEach(est => {
      const dueDate = new Date(est.dueDate);
      const year = dueDate.getUTCFullYear();
      const monthIndex = dueDate.getUTCMonth(); // 0-indexed

      // 1. Reminder Event (1st of the month)
      const reminderDate = new Date(Date.UTC(year, monthIndex, 1));
      events.push({
        groupKey: reminderDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
        sortDate: reminderDate,
        dateStr: reminderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
        title: `Reminder: ${this.getUIQuarterLabel(est.quarter).split(' ')[0]} Estimated Tax Payment`,
        message: `Reminder for upcoming ${this.getUIQuarterLabel(est.quarter).split(' ')[0].toLowerCase()} estimated tax payment due on ${this.formatDate(est.dueDate)}`,
        badge: 'reminder'
      });

      // 2. Payment Event (due date itself, which is 15th)
      events.push({
        groupKey: dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
        sortDate: dueDate,
        dateStr: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
        title: `${this.getUIQuarterLabel(est.quarter).split(' ')[0]} Estimated Tax Payment`,
        message: `${this.getUIQuarterWord(est.quarter)} quarter estimated tax payment due`,
        badge: 'payment'
      });
    });

    // Sort events by date descending
    events.sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

    // Group events by Month Year
    const groupsMap = new Map<string, any[]>();
    events.forEach(evt => {
      const current = groupsMap.get(evt.groupKey) || [];
      // Avoid duplicate reminder/payment entries for the exact same quarter
      const isDuplicate = current.some(e => e.title === evt.title && e.dateStr === evt.dateStr);
      if (!isDuplicate) {
        current.push(evt);
      }
      groupsMap.set(evt.groupKey, current);
    });

    // Transform map to array of groups
    this.calendarGroups = Array.from(groupsMap.entries()).map(([monthYear, items]) => {
      // Sort items within group (reminder on 1st should appear before payment on 15th, meaning ASC order in calendar)
      items.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
      return {
        monthYear,
        items
      };
    });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
