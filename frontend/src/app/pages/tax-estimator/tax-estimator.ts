import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Dropdown } from '../../components/dropdown/dropdown';

@Component({
  selector: 'app-tax-estimator',
  imports: [FormsModule, CommonModule, RouterLink, Dropdown],
  templateUrl: './tax-estimator.html',
  styleUrl: './tax-estimator.css'
})
export class TaxEstimator implements OnInit {
  countriesList = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Switzerland', 'Japan', 'Singapore', 'China'];

  get filingStatusesList(): any[] {
    return this.getFilingStatusesForSelectedCountry().map(s => ({ value: s, label: s }));
  }

  get stateOptionsList(): any[] {
    return this.getStateOptions(this.selectedCountry).map(s => ({ value: s, label: s }));
  }

  get quartersDropdownList(): any[] {
    return this.quarterOptions.map(opt => ({
      value: opt.key,
      label: `${opt.label} (${opt.dateRange})`
    }));
  }
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
  quarterOptions: any[] = [];
  selectedQuarterKey = '';

  // Mapping of countries to their allowed filing statuses
  countryFilingStatuses: Record<string, string[]> = {
    'United States': ['Single', 'Married Filing Jointly', 'Married Filing Separately', 'Head of Household'],
    'Germany': ['Single', 'Married Filing Jointly', 'Married Filing Separately'],
    'Switzerland': ['Single', 'Married Filing Jointly'],
    'France': ['Single', 'Married Filing Jointly'],
    'India': ['Single'],
    'United Kingdom': ['Single'],
    'China': ['Single'],
    'Japan': ['Single'],
    'Canada': ['Single'],
    'Australia': ['Single'],
    'Singapore': ['Single']
  };

  getFilingStatusesForSelectedCountry(): string[] {
    return this.countryFilingStatuses[this.selectedCountry] || ['Single'];
  }

  selectedState = 'California';

  hasStateSelect(country: string): boolean {
    const targets = ['United States', 'Canada', 'Switzerland', 'United Kingdom', 'Japan'];
    return targets.includes(country);
  }

  getStateLabel(country: string): string {
    switch (country) {
      case 'United States':
        return 'State';
      case 'Canada':
        return 'Province/Territory';
      case 'Switzerland':
        return 'Canton';
      case 'United Kingdom':
        return 'Taxpayer Region';
      case 'Japan':
        return 'Prefecture (Local Inhabitant Tax)';
      default:
        return 'State/Province';
    }
  }

  getStateOptions(country: string): string[] {
    switch (country) {
      case 'United States':
        return ['California', 'New York', 'Texas', 'Florida', 'Illinois', 'Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'New Jersey'];
      case 'Canada':
        return ['Ontario', 'Quebec', 'British Columbia', 'Alberta'];
      case 'Switzerland':
        return ['Zurich', 'Geneva', 'Vaud', 'Bern'];
      case 'United Kingdom':
        return ['England / Wales / Northern Ireland', 'Scotland'];
      case 'Japan':
        return ['None (Federal Tax Only)', 'Tokyo', 'Osaka', 'Kyoto'];
      default:
        return [];
    }
  }

  onCountryChange() {
    const allowed = this.getFilingStatusesForSelectedCountry();
    if (!allowed.includes(this.selectedFilingStatus)) {
      this.selectedFilingStatus = allowed[0];
    }

    if (this.selectedCountry === 'United States') {
      this.selectedState = 'California';
    } else if (this.selectedCountry === 'Canada') {
      this.selectedState = 'Ontario';
    } else if (this.selectedCountry === 'Switzerland') {
      this.selectedState = 'Zurich';
    } else if (this.selectedCountry === 'United Kingdom') {
      this.selectedState = 'England / Wales / Northern Ireland';
    } else if (this.selectedCountry === 'Japan') {
      this.selectedState = 'None (Federal Tax Only)';
    } else {
      this.selectedState = '';
    }
  }

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

  // Calendar Grid state variables
  isCalendarGridView = false;
  gridMonthStr = ''; // e.g. "2025-06"
  calendarGridWeeks: any[] = [];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    this.generateQuarterOptions();

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

  generateQuarterOptions() {
    const now = new Date();
    const currentMonth = now.getUTCMonth(); // 0-11
    const currentYear = now.getUTCFullYear();
    const currentCalQuarter = Math.floor(currentMonth / 3); // 0-3

    const options = [];
    for (let i = 0; i < 4; i++) {
      const targetCalQuarter = (currentCalQuarter + i) % 4;
      const yearOffset = Math.floor((currentCalQuarter + i) / 4);
      const targetCalYear = currentYear + yearOffset;

      let quarter = '';
      let year = targetCalYear;
      let label = '';

      if (targetCalQuarter === 0) { // Jan-Mar
        quarter = 'Q4';
        year = targetCalYear - 1;
        label = `Q1 (Jan-Mar ${targetCalYear})`;
      } else if (targetCalQuarter === 1) { // Apr-Jun
        quarter = 'Q1';
        year = targetCalYear;
        label = `Q2 (Apr-Jun ${targetCalYear})`;
      } else if (targetCalQuarter === 2) { // Jul-Sep
        quarter = 'Q2';
        year = targetCalYear;
        label = `Q3 (Jul-Sep ${targetCalYear})`;
      } else if (targetCalQuarter === 3) { // Oct-Dec
        quarter = 'Q3';
        year = targetCalYear;
        label = `Q4 (Oct-Dec ${targetCalYear})`;
      }

      const key = `${quarter}_${year}`;
      options.push({ key, quarter, year, label });
    }

    this.quarterOptions = options;
    if (options.length > 0) {
      this.selectedQuarterKey = options[0].key;
    }
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
    if (tab === 'calendar') {
      this.initGridCalendar();
    }
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
          this.initGridCalendar();
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

    let quarter = this.selectedQuarter;
    let year = new Date().getUTCFullYear();

    if (this.selectedQuarterKey) {
      const parts = this.selectedQuarterKey.split('_');
      if (parts.length === 2) {
        quarter = parts[0];
        year = Number(parts[1]);
      }
    }

    const payload = {
      country: this.selectedCountry,
      state: this.hasStateSelect(this.selectedCountry) ? this.selectedState : '',
      quarter: quarter,
      year: year,
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

  getUIQuarterLabel(quarter: string, dueDate?: string | Date): string {
    let yearSuffix = '';
    if (dueDate) {
      const year = new Date(dueDate).getUTCFullYear();
      yearSuffix = ` ${year}`;
    }
    if (quarter === 'Q1') return `Q2 (Apr-Jun${yearSuffix})`;
    if (quarter === 'Q2') return `Q3 (Jul-Sep${yearSuffix})`;
    if (quarter === 'Q3') return `Q4 (Oct-Dec${yearSuffix})`;
    if (quarter === 'Q4') return `Q1 (Jan-Mar${yearSuffix})`;
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

  getInputPaddingLeft(country: string): string {
    const symbol = this.getCurrencySymbol(country);
    if (symbol.length === 3) return '56px';
    if (symbol.length === 2) return '45px';
    return '36px';
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
        badge: 'reminder',
        id: est._id,
        status: est.status || 'Pending'
      });

      // 2. Payment Event (due date itself, which is 15th)
      events.push({
        groupKey: dueDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }),
        sortDate: dueDate,
        dateStr: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
        title: `${this.getUIQuarterLabel(est.quarter).split(' ')[0]} Estimated Tax Payment`,
        message: `${this.getUIQuarterWord(est.quarter)} quarter estimated tax payment due`,
        badge: 'payment',
        id: est._id,
        status: est.status || 'Pending'
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

  autoFillFromTransactions() {
    this.api.getTransactions().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const txs = res.data;
          let targetQuarter = this.selectedQuarter;
          let targetYear = new Date().getUTCFullYear();
          if (this.selectedQuarterKey) {
            const parts = this.selectedQuarterKey.split('_');
            if (parts.length === 2) {
              targetQuarter = parts[0];
              targetYear = Number(parts[1]);
            }
          }

          // Determine the target months (0-indexed)
          let targetMonths: number[] = [];
          if (targetQuarter === 'Q4') targetMonths = [0, 1, 2]; // Jan-Mar
          else if (targetQuarter === 'Q1') targetMonths = [3, 4, 5]; // Apr-Jun
          else if (targetQuarter === 'Q2') targetMonths = [6, 7, 8]; // Jul-Sep
          else if (targetQuarter === 'Q3') targetMonths = [9, 10, 11]; // Oct-Dec

          // Retrieve categories to check deductible status
          this.api.getCategories().subscribe({
            next: (catRes: any) => {
              let categoriesList = [];
              if (catRes && catRes.data) categoriesList = catRes.data;
              else if (Array.isArray(catRes)) categoriesList = catRes;
              else if (catRes && Array.isArray(catRes.categories)) categoriesList = catRes.categories;
              
              const deductibleMap: Record<string, boolean> = {};
              categoriesList.forEach((c: any) => {
                deductibleMap[c.name.toLowerCase()] = c.taxDeductible !== false;
              });

              let incomeSum = 0;
              let expenseSum = 0;

              txs.forEach((t: any) => {
                if (t.transactionDate) {
                  const d = new Date(t.transactionDate);
                  const y = d.getUTCFullYear();
                  const m = d.getUTCMonth();
                  if (y === targetYear && targetMonths.includes(m)) {
                    const amt = Number(t.amount) || 0;
                    if (t.type === 'Income') incomeSum += amt;
                    else if (t.type === 'Expense') {
                      const isDeductible = deductibleMap[t.category.toLowerCase()] !== false;
                      if (isDeductible) {
                        expenseSum += amt;
                      }
                    }
                  }
                }
              });

              this.grossIncome = incomeSum;
              this.businessExpenses = expenseSum;
              alert(`Auto-filled: gross income ${this.formatCurrency(incomeSum)}, deductible expenses ${this.formatCurrency(expenseSum)} from ${txs.length} transactions for ${this.getUIQuarterLabel(targetQuarter)}.`);
            },
            error: (err) => {
              console.error('Error fetching categories for autofill:', err);
              // Fallback to legacy calculation if categories fails
              let incomeSum = 0;
              let expenseSum = 0;
              txs.forEach((t: any) => {
                if (t.transactionDate) {
                  const d = new Date(t.transactionDate);
                  const y = d.getUTCFullYear();
                  const m = d.getUTCMonth();
                  if (y === targetYear && targetMonths.includes(m)) {
                    const amt = Number(t.amount) || 0;
                    if (t.type === 'Income') incomeSum += amt;
                    else if (t.type === 'Expense') expenseSum += amt;
                  }
                }
              });
              this.grossIncome = incomeSum;
              this.businessExpenses = expenseSum;
              alert(`Auto-filled (fallback): gross income ${this.formatCurrency(incomeSum)}, expenses ${this.formatCurrency(expenseSum)} for ${this.getUIQuarterLabel(targetQuarter)}.`);
            }
          });
        }
      },
      error: (err) => {
        console.error('Error fetching transactions for autofill:', err);
        alert('Failed to fetch transactions for auto-fill.');
      }
    });
  }

  getTaxBreakdown(est: any): { federal: number; state: number; effectiveRate: number } {
    if (!est || !est.estimatedTax) {
      return { federal: 0, state: 0, effectiveRate: 0 };
    }

    const annualTaxableIncome = est.annualTaxableIncome || (est.grossIncomeForQuarter * 4);
    let stateTax = 0;
    const country = est.country || this.selectedCountry;
    const stateVal = est.state || this.selectedState;

    if (country === 'United States') {
      const normState = (stateVal || '').trim().toLowerCase();
      if (normState === 'california') {
        const limits = [0, 10000, 25000, 40000, 55000, 70000, 350000, 420000, 700000, Infinity];
        const rates = [1, 2, 4, 6, 8, 9.3, 10.3, 11.3, 13.3];
        for (let i = 0; i < rates.length; i++) {
          const from = limits[i];
          const to = limits[i + 1];
          if (annualTaxableIncome > from) {
            const taxable = Math.min(annualTaxableIncome, to) - from;
            stateTax += taxable * (rates[i] / 100);
          }
        }
      } else if (normState === 'new york') {
        const limits = [0, 12000, 25000, 80000, 215000, 1000000, 5000000, Infinity];
        const rates = [4, 4.5, 5.85, 6.25, 6.85, 9.65, 10.9];
        for (let i = 0; i < rates.length; i++) {
          const from = limits[i];
          const to = limits[i + 1];
          if (annualTaxableIncome > from) {
            const taxable = Math.min(annualTaxableIncome, to) - from;
            stateTax += taxable * (rates[i] / 100);
          }
        }
      } else if (normState === 'illinois') {
        stateTax = annualTaxableIncome * 0.0495;
      } else if (normState === 'pennsylvania') {
        stateTax = annualTaxableIncome * 0.0307;
      } else if (normState === 'ohio') {
        const limits = [0, 26050, 46100, 100000, Infinity];
        const rates = [0, 1.38, 2.25, 2.75];
        for (let i = 0; i < rates.length; i++) {
          const from = limits[i];
          const to = limits[i + 1];
          if (annualTaxableIncome > from) {
            const taxable = Math.min(annualTaxableIncome, to) - from;
            stateTax += taxable * (rates[i] / 100);
          }
        }
      } else if (normState === 'georgia') {
        stateTax = annualTaxableIncome * 0.0519;
      } else if (normState === 'north carolina') {
        stateTax = annualTaxableIncome * 0.0399;
      } else if (normState === 'new jersey') {
        const limits = [0, 20000, 35000, 40000, 75000, 500000, 1000000, Infinity];
        const rates = [1.4, 1.75, 3.5, 5.525, 6.37, 8.97, 10.75];
        for (let i = 0; i < rates.length; i++) {
          const from = limits[i];
          const to = limits[i + 1];
          if (annualTaxableIncome > from) {
            const taxable = Math.min(annualTaxableIncome, to) - from;
            stateTax += taxable * (rates[i] / 100);
          }
        }
      }
    } else if (country === 'Canada') {
      const normState = (stateVal || '').trim().toLowerCase();
      if (normState === 'ontario') {
        stateTax = annualTaxableIncome * 0.0505;
      } else if (normState === 'quebec') {
        stateTax = annualTaxableIncome * 0.15;
      } else if (normState === 'british columbia') {
        stateTax = annualTaxableIncome * 0.0506;
      } else if (normState === 'alberta') {
        stateTax = annualTaxableIncome * 0.10;
      }
    } else if (country === 'Switzerland') {
      const normState = (stateVal || '').trim().toLowerCase();
      if (normState === 'zurich') {
        stateTax = annualTaxableIncome * 0.07;
      } else if (normState === 'geneva') {
        stateTax = annualTaxableIncome * 0.12;
      } else if (normState === 'vaud') {
        stateTax = annualTaxableIncome * 0.10;
      } else if (normState === 'bern') {
        stateTax = annualTaxableIncome * 0.09;
      }
    } else if (country === 'United Kingdom') {
      const isScotland = (stateVal || '').trim().toLowerCase().includes('scotland');
      if (isScotland) {
        stateTax = est.estimatedTax * 4 * 0.45;
      }
    }

    const quarterlyStateTax = Math.min(est.estimatedTax, Number((stateTax / 4).toFixed(2)));
    const quarterlyFederalTax = Number((est.estimatedTax - quarterlyStateTax).toFixed(2));
    
    const gross = est.grossIncomeForQuarter || 1;
    const effectiveRate = Number(((est.estimatedTax / gross) * 100).toFixed(1));

    return {
      federal: quarterlyFederalTax,
      state: quarterlyStateTax,
      effectiveRate
    };
  }

  initGridCalendar() {
    if (!this.gridMonthStr) {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      this.gridMonthStr = `${y}-${m}`;
    }
    this.generateGridWeeks();
  }

  generateGridWeeks() {
    const parts = this.gridMonthStr.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();

    const monthEvents: any[] = [];
    this.estimatesHistory.forEach(est => {
      const dueDate = new Date(est.dueDate);
      if (dueDate.getUTCFullYear() === year && dueDate.getUTCMonth() === month) {
        monthEvents.push({
          day: dueDate.getUTCDate(),
          type: 'payment',
          title: `${est.quarter} Due`,
          status: est.status || 'Pending',
          id: est._id
        });
      }
      const reminderDate = new Date(dueDate);
      reminderDate.setUTCDate(1);
      if (reminderDate.getUTCFullYear() === year && reminderDate.getUTCMonth() === month) {
        monthEvents.push({
          day: 1,
          type: 'reminder',
          title: `${est.quarter} Remind`,
          status: 'Pending',
          id: est._id
        });
      }
    });

    const weeks = [];
    let days = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ day: null, events: [] });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dayEvts = monthEvents.filter(e => e.day === d);
      days.push({ day: d, events: dayEvts });
      if (days.length === 7) {
        weeks.push(days);
        days = [];
      }
    }

    if (days.length > 0) {
      while (days.length < 7) {
        days.push({ day: null, events: [] });
      }
      weeks.push(days);
    }

    this.calendarGridWeeks = weeks;
  }

  prevGridMonth() {
    const parts = this.gridMonthStr.split('-');
    let y = Number(parts[0]);
    let m = Number(parts[1]) - 1;
    if (m === 0) {
      m = 12;
      y--;
    }
    this.gridMonthStr = `${y}-${String(m).padStart(2, '0')}`;
    this.generateGridWeeks();
  }

  nextGridMonth() {
    const parts = this.gridMonthStr.split('-');
    let y = Number(parts[0]);
    let m = Number(parts[1]) + 1;
    if (m === 13) {
      m = 1;
      y++;
    }
    this.gridMonthStr = `${y}-${String(m).padStart(2, '0')}`;
    this.generateGridWeeks();
  }

  togglePaymentStatus(id: string, currentStatus: string) {
    const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid';
    this.api.updateTaxEstimate(id, { status: newStatus }).subscribe({
      next: () => {
        this.loadEstimates();
      },
      error: (err) => {
        console.error('Error toggling payment status:', err);
        alert('Failed to update payment status. Please try again.');
      }
    });
  }

  downloadCalculationBreakdown() {
    if (!this.calculationResult) return;

    const res = this.calculationResult;
    const breakdown = this.getTaxBreakdown(res);
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker is preventing breakdown generation. Please allow pop-ups for this site.');
      return;
    }

    const htmlContent = `
      <html>
      <head>
        <title>TaxPal - Calculation Breakdown</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #ffffff; }
          .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #6366f1; }
          .title { font-size: 16px; color: #64748b; margin-top: 5px; text-transform: uppercase; letter-spacing: 0.5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 30px; }
          .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
          .section h2 { font-size: 15px; color: #4f46e5; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
          .row.highlight { font-weight: bold; font-size: 15px; color: #0f172a; border-top: 1px dashed #e2e8f0; padding-top: 12px; margin-top: 12px; }
          .row.total { font-weight: bold; font-size: 18px; color: #6366f1; border-top: 2px solid #6366f1; padding-top: 12px; margin-top: 16px; }
          .footer { font-size: 12px; color: #94a3b8; text-align: center; margin-top: 60px; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">TaxPal</div>
          <div class="title">Quarterly Advanced Tax Calculation Breakdown</div>
        </div>

        <div class="grid">
          <div class="section">
            <h2>Inputs & Scope</h2>
            <div class="row"><span>Country of Filing:</span> <span>${res.country}</span></div>
            <div class="row"><span>Filing Status:</span> <span>${res.filingStatus}</span></div>
            <div class="row"><span>State / Region:</span> <span>${res.state || 'N/A'}</span></div>
            <div class="row"><span>Tax Period:</span> <span>${this.getUIQuarterLabel(res.quarter, res.dueDate)}</span></div>
            <div class="row highlight"><span>Gross Quarterly Income:</span> <span>${this.formatCurrencyWithCountry(res.grossIncomeForQuarter, res.country)}</span></div>
          </div>

          <div class="section">
            <h2>Deductions Claimed</h2>
            <div class="row"><span>Business Expenses:</span> <span>${this.formatCurrencyWithCountry(res.businessExpenses || 0, res.country)}</span></div>
            <div class="row"><span>Retirement Contributions:</span> <span>${this.formatCurrencyWithCountry(res.retirementContribution || 0, res.country)}</span></div>
            <div class="row"><span>Health Insurance Premiums:</span> <span>${this.formatCurrencyWithCountry(res.healthInsurancePremiums || 0, res.country)}</span></div>
            <div class="row"><span>Home Office Deduction:</span> <span>${this.formatCurrencyWithCountry(res.homeOfficeDeduction || 0, res.country)}</span></div>
            <div class="row highlight"><span>Total Deductions:</span> <span>${this.formatCurrencyWithCountry((res.businessExpenses || 0) + (res.retirementContribution || 0) + (res.healthInsurancePremiums || 0) + (res.homeOfficeDeduction || 0), res.country)}</span></div>
          </div>
        </div>

        <div class="section" style="max-width: 600px; margin: 0 auto;">
          <h2>Tax Summary Projections</h2>
          <div class="row"><span>Quarterly Federal Tax Component:</span> <span>${this.formatCurrencyWithCountry(breakdown.federal, res.country)}</span></div>
          <div class="row"><span>Quarterly State/Local Component:</span> <span>${this.formatCurrencyWithCountry(breakdown.state, res.country)}</span></div>
          <div class="row"><span>Effective Overall Tax Rate:</span> <span>${breakdown.effectiveRate}%</span></div>
          <div class="row"><span>Payment Due Date:</span> <span>${this.formatDate(res.dueDate)}</span></div>
          <div class="row total"><span>Total Estimated Quarterly Tax:</span> <span>${this.formatCurrencyWithCountry(res.estimatedTax, res.country)}</span></div>
          <div class="row"><span>Annualized Tax Projection:</span> <span>${this.formatCurrencyWithCountry(res.estimatedTax * 4, res.country)}</span></div>
        </div>

        <div class="footer">
          TaxPal - Automated Freelance Tax Estimator. Generated on ${new Date().toLocaleDateString()}.
        </div>

        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  formatMonthDisplay(monthStr: string): string {
    if (!monthStr) return '';
    const parts = monthStr.split('-');
    if (parts.length !== 2) return monthStr;
    const year = parts[0];
    const monthIdx = Number(parts[1]) - 1;
    const date = new Date(Number(year), monthIdx, 1);
    return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
