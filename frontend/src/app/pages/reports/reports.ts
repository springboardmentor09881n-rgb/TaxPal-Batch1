import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Dropdown } from '../../components/dropdown/dropdown';

export interface ICategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface IMonthlyBreakdown {
  month: string;
  income: number;
  expenses: number;
  netSavings: number;
}

export interface IReportItem {
  _id: string;
  userId: string;
  reportType: string;
  period: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  format: 'PDF' | 'CSV';
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  filePath?: string;
  data?: {
    categoryBreakdown?: ICategoryBreakdown[];
    incomeCategoryBreakdown?: ICategoryBreakdown[];
    monthlyBreakdown?: IMonthlyBreakdown[];
    transactionCount?: number;
    incomeTransactionCount?: number;
    expenseTransactionCount?: number;
    savingsRate?: number;
    recentTransactions?: any[];
    // Expense Breakdown specific
    avgExpensePerTransaction?: number;
    topExpenseCategory?: string;
    // Tax Summary specific
    taxableIncome?: number;
    totalDeductible?: number;
    deductionBreakdown?: Array<{ category: string; amount: number; count: number }>;
    effectiveTaxRate?: number;
    estimatedAnnualTax?: number;
    totalEstimatedTax?: number;
    quarterlyEstimates?: Array<{
      quarter: string;
      grossIncome: number;
      estimatedTax: number;
      dueDate: string | Date;
      status: string;
      country: string;
      businessExpenses: number;
      retirementContribution: number;
      healthInsurancePremiums: number;
      homeOfficeDeduction: number;
    }>;
    country?: string;
  };
  createdAt: string | Date;
  updatedAt: string | Date;
}

@Component({
  selector: 'app-reports',
  imports: [FormsModule, CommonModule, RouterLink, Dropdown],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnInit {
  // Getters for custom dropdowns
  get filterReportTypesList(): any[] {
    const list = [{ value: '', label: 'All Report Types' }];
    this.reportTypes.forEach(rt => {
      list.push({ value: rt, label: rt });
    });
    return list;
  }
  isLightTheme = false;
  userName = 'Freelancer';
  isLoading = false;
  isGenerating = false;
  errorMessage = '';
  successMessage = '';

  // Form Fields
  reportTypes = [
    'Income Statement',
    'Profit & Loss (P&L) Statement',
    'Income & Expense Summary',
    'Expense Breakdown',
    'Tax Summary',
    'Schedule C (Form 1040) Tax Summary',
    'Quarterly Tax Summary'
  ];
  periods = [
    'Current Month',
    'Last Month',
    'Current Quarter',
    'Last Quarter',
    'Year to Date',
    'Annual',
    'Custom Range'
  ];
  formats: ('PDF' | 'CSV')[] = ['PDF', 'CSV'];

  selectedReportType = 'Income Statement';
  selectedPeriod = 'Current Month';
  selectedFormat: 'PDF' | 'CSV' = 'PDF';

  customStartDate = '';
  customEndDate = '';

  // Reports data
  reports: IReportItem[] = [];
  selectedReport: IReportItem | null = null;

  // Direct Email modal state
  showEmailModal = false;
  recipientEmail = '';
  emailFormat: 'PDF' | 'CSV' = 'PDF';
  isSendingEmail = false;

  // Scheduled Reports
  scheduledReports: any[] = [];
  showScheduleModal = false;
  scheduleEmail = '';
  scheduleReportType = 'Income Statement';
  scheduleFormat: 'PDF' | 'CSV' = 'PDF';
  isSavingSchedule = false;

  // Toast notifications
  toast = { show: false, message: '', type: 'success' as 'success' | 'error' };

  // Search & Filters for History
  searchQuery = '';
  filterReportType = '';

  get filteredReports(): IReportItem[] {
    return this.reports.filter(r => {
      const query = (this.searchQuery || '').trim().toLowerCase();
      const matchesQuery = !query || 
        (r.reportType || '').toLowerCase().includes(query) ||
        (r.period || '').toLowerCase().includes(query);
      
      const matchesType = !this.filterReportType || r.reportType === this.filterReportType;
      
      return matchesQuery && matchesType;
    });
  }

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Theme sync
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
    }

    // User details sync
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.fullName || 'Freelancer';
      } catch (e) {
        console.error('Error parsing user storage:', e);
      }
    }

    this.loadReports();
    this.loadScheduledReports();
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

  loadReports() {
    this.isLoading = true;
    this.errorMessage = '';
    this.api.getReports().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.data) {
          this.reports = res.data;
          // If no report selected or previous selected report is updated, keep preview
          if (this.reports.length > 0 && !this.selectedReport) {
            this.selectedReport = this.reports[0];
          } else if (this.selectedReport) {
            const updated = this.reports.find(r => r._id === this.selectedReport?._id);
            if (updated) {
              this.selectedReport = updated;
            }
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error loading reports:', err);
        if (err.status === 401) {
          this.logout();
        } else {
          this.errorMessage = 'Failed to load reports. Please try again.';
        }
      }
    });
  }

  onPeriodChange() {
    if (this.selectedPeriod === 'Custom Range') {
      const now = new Date();
      const firstDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      this.customStartDate = firstDay.toISOString().split('T')[0];
      this.customEndDate = now.toISOString().split('T')[0];
    }
  }

  resetForm() {
    this.selectedReportType = 'Income Statement';
    this.selectedPeriod = 'Current Month';
    this.selectedFormat = 'PDF';
    this.customStartDate = '';
    this.customEndDate = '';
    this.errorMessage = '';
    this.successMessage = '';
  }

  generateReport() {
    if (this.selectedPeriod === 'Custom Range') {
      if (!this.customStartDate || !this.customEndDate) {
        alert('Please select both start date and end date for custom range.');
        return;
      }
      if (new Date(this.customStartDate) > new Date(this.customEndDate)) {
        alert('Start date cannot be after end date.');
        return;
      }
    }

    this.isGenerating = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      reportType: this.selectedReportType,
      period: this.selectedPeriod,
      format: this.selectedFormat,
      startDate: this.selectedPeriod === 'Custom Range' ? this.customStartDate : undefined,
      endDate: this.selectedPeriod === 'Custom Range' ? this.customEndDate : undefined
    };

    this.api.generateReport(payload).subscribe({
      next: (res: any) => {
        this.isGenerating = false;
        if (res && res.data) {
          this.successMessage = 'Report generated successfully!';
          this.selectedReport = res.data;
          this.loadReports();
          setTimeout(() => {
            this.successMessage = '';
          }, 4000);
        }
      },
      error: (err: any) => {
        this.isGenerating = false;
        console.error('Error generating report:', err);
        this.errorMessage = err?.error?.message || 'Failed to generate report. Please try again.';
      }
    });
  }

  selectReport(report: IReportItem) {
    this.selectedReport = report;
  }

  downloadReport(report: IReportItem, formatOverride?: string) {
    const format = formatOverride || report.format || 'PDF';
    this.api.downloadReport(report._id, format).subscribe({
      next: (blob: any) => {
        const safePeriod = (report.period || 'Report').replace(/[^a-zA-Z0-9_-]/g, '_');
        const safeType = (report.reportType || 'Summary').replace(/[^a-zA-Z0-9_-]/g, '_');
        const ext = format.toLowerCase() === 'csv' ? 'csv' : 'pdf';
        const mimeType = format.toLowerCase() === 'csv' ? 'text/csv;charset=utf-8;' : 'application/pdf';
        
        const fileBlob = new Blob([blob], { type: mimeType });
        const url = window.URL.createObjectURL(fileBlob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `TaxPal_${safeType}_${safePeriod}.${ext}`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 200);
      },
      error: (err: any) => {
        console.error('Error downloading report:', err);
        alert('Failed to download report file. Please try again.');
      }
    });
  }

  printPreview() {
    window.print();
  }

  deleteReport(id: string, event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    if (confirm('Are you sure you want to delete this report?')) {
      this.api.deleteReport(id).subscribe({
        next: () => {
          if (this.selectedReport && this.selectedReport._id === id) {
            this.selectedReport = null;
          }
          this.loadReports();
        },
        error: (err: any) => {
          console.error('Error deleting report:', err);
          alert('Failed to delete report. Please try again.');
        }
      });
    }
  }

  getCurrencySymbol(country: string): string {
    const c = (country || '').trim().toLowerCase();
    if (c === 'india' || c === 'in') return '₹';
    if (c === 'japan' || c === 'jp' || c === 'china' || c === 'cn') return '¥';
    if (c === 'germany' || c === 'de' || c === 'france' || c === 'fr') return '€';
    if (c === 'united kingdom' || c === 'uk' || c === 'gb') return '£';
    if (c === 'switzerland' || c === 'ch') return 'CHF';
    if (c === 'singapore' || c === 'sg') return 'S$';
    return '$';
  }

  formatCurrency(amount: number | undefined): string {
    const country = this.selectedReport?.data?.country || 'United States';
    const symbol = this.getCurrencySymbol(country);
    return symbol + ' ' + (amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getDonutSegments(breakdown: ICategoryBreakdown[] | undefined): any[] {
    if (!breakdown || breakdown.length === 0) return [];
    
    let accumulatedPercentage = 0;
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#3b82f6', '#6b7280'];
    
    return breakdown.map((cat, idx) => {
      const percent = cat.percentage || 0;
      const strokeDashArray = `${percent} ${100 - percent}`;
      const strokeDashOffset = 100 - accumulatedPercentage + 25; // start from top
      accumulatedPercentage += percent;
      
      return {
        category: cat.category,
        amount: cat.amount,
        percentage: percent,
        dashArray: strokeDashArray,
        dashOffset: strokeDashOffset,
        color: colors[idx % colors.length]
      };
    });
  }

  getBarHeight(val: number, income: number, expense: number): number {
    const max = Math.max(income, expense, 1);
    return Math.max(10, Math.round((val / max) * 140)); // Max bar height 140px
  }

  formatDate(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatShortDate(dateInput: any): string {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toast = { show: true, message, type };
    setTimeout(() => {
      this.toast.show = false;
    }, 4000);
  }

  // Email report action
  openEmailModal() {
    if (!this.selectedReport) return;
    this.recipientEmail = '';
    this.emailFormat = this.selectedReport.format || 'PDF';
    this.showEmailModal = true;
  }

  openQuickEmailModal(report: IReportItem, event: MouseEvent) {
    event.stopPropagation();
    this.selectedReport = report;
    this.openEmailModal();
  }

  closeEmailModal() {
    this.showEmailModal = false;
  }

  sendEmailReport() {
    if (!this.selectedReport || !this.recipientEmail) return;
    this.isSendingEmail = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.emailReport(this.selectedReport._id, this.recipientEmail, this.emailFormat).subscribe({
      next: () => {
        this.isSendingEmail = false;
        this.showEmailModal = false;
        this.showToast('Report successfully sent to ' + this.recipientEmail, 'success');
      },
      error: (err: any) => {
        this.isSendingEmail = false;
        this.showToast(err.error?.message || 'Failed to send email. Please try again.', 'error');
      }
    });
  }

  // Scheduled recurring reports action
  loadScheduledReports() {
    this.api.getScheduledReports().subscribe({
      next: (res: any) => {
        this.scheduledReports = res?.data || [];
      },
      error: (err: any) => {
        console.error('Failed to load scheduled reports:', err);
      }
    });
  }

  openScheduleModal() {
    this.scheduleEmail = '';
    this.scheduleReportType = this.reportTypes[0];
    this.scheduleFormat = 'PDF';
    this.showScheduleModal = true;
  }

  closeScheduleModal() {
    this.showScheduleModal = false;
  }

  createRecurringSchedule() {
    if (!this.scheduleEmail) return;
    this.isSavingSchedule = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      email: this.scheduleEmail,
      reportType: this.scheduleReportType,
      format: this.scheduleFormat
    };

    this.api.createScheduledReport(payload).subscribe({
      next: () => {
        this.isSavingSchedule = false;
        this.showScheduleModal = false;
        this.showToast('Automated monthly report scheduled successfully to ' + this.scheduleEmail, 'success');
        this.loadScheduledReports();
      },
      error: (err: any) => {
        this.isSavingSchedule = false;
        this.showToast(err.error?.message || 'Failed to schedule report. Please try again.', 'error');
      }
    });
  }

  deleteSchedule(id: string) {
    if (!confirm('Are you sure you want to cancel this scheduled report?')) return;
    this.errorMessage = '';
    this.successMessage = '';

    this.api.deleteScheduledReport(id).subscribe({
      next: () => {
        this.showToast('Scheduled report cancelled successfully', 'success');
        this.loadScheduledReports();
      },
      error: (err: any) => {
        this.showToast('Failed to cancel scheduled report', 'error');
      }
    });
  }
}
