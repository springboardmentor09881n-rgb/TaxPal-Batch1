import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {

  transactions: any[] = [];
  isLoading = false;
  errorMessage = '';
  userName = 'Freelancer';
  isLightTheme = false;

  totalIncome = 0;
  totalExpense = 0;
  savings = 0;

  expenseCategories: any[] = [];
  isLoadingChart = false;
  spendingChart: any;
  incomeExpenseChart: any;
  chartTimePeriod: 'year' | 'quarter' | 'month' | 'all' = 'all';

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
    this.loadTransactions();
    this.loadChartData();
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

  ngAfterViewInit() {
    if (this.expenseCategories.length > 0) {
      this.renderSpendingChart();
    }
    this.renderIncomeExpenseChart();
  }

  ngOnDestroy() {
    if (this.spendingChart) {
      this.spendingChart.destroy();
    }
    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.destroy();
    }
  }

  loadTransactions() {
    this.isLoading = true;
    this.errorMessage = '';
    this.api.getTransactions().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.data) {
          this.transactions = res.data;
        } else {
          this.transactions = [];
        }
        this.calculateMetrics();
        // Re-render charts after transactions loaded
        setTimeout(() => {
          this.renderIncomeExpenseChart();
        }, 100);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error loading transactions:', err);
        if (err.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Failed to load transaction data. Please try again.';
        }
      }
    });
  }

  loadChartData() {
    this.isLoadingChart = true;
    this.api.getTransactions().subscribe({
      next: (res: any) => {
        this.isLoadingChart = false;
        if (res && res.data) {
          const expenses = res.data.filter((t: any) => t.type === 'Expense');
          
          const categoryMap = new Map<string, number>();
          expenses.forEach((t: any) => {
            const amount = Number(t.amount) || 0;
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + amount);
          });

          this.expenseCategories = Array.from(categoryMap.entries()).map(([category, amount]) => ({
            category,
            amount
          }));

          setTimeout(() => {
            this.renderSpendingChart();
          }, 100);
        }
      },
      error: (err: any) => {
        this.isLoadingChart = false;
        console.error('Error loading chart data:', err);
      }
    });
  }

  renderSpendingChart() {
    const canvas = document.getElementById('spendingChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Spending chart canvas not found');
      return;
    }

    if (this.spendingChart) {
      this.spendingChart.destroy();
    }

    const categories = this.expenseCategories.map(e => e.category);
    const amounts = this.expenseCategories.map(e => e.amount);
    const total = amounts.reduce((a, b) => a + b, 0);

    if (total === 0) {
      console.log('No expense data to render spending chart');
      return;
    }

    const colors = [
      '#6366f1', '#a855f7', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'
    ];

    this.spendingChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: categories.map((cat, i) => `${cat} (${((amounts[i] / total) * 100).toFixed(1)}%)`),
        datasets: [{
          data: amounts,
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#94a3b8',
              font: {
                family: 'Plus Jakarta Sans',
                size: 12,
                weight: 500
              },
              padding: 20
            }
          },
          tooltip: {
            enabled: total > 0,
            backgroundColor: '#0c101b',
            titleColor: '#fff',
            bodyColor: '#94a3b8',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.raw as number;
                const pct = ((val / total) * 100).toFixed(1);
                return ` ₹${val.toLocaleString('en-IN')} (${pct}%)`;
              }
            }
          }
        },
        cutout: '75%'
      }
    });
  }

  getChartTotals(): { income: number; expense: number } {
    let filteredIncome = 0;
    let filteredExpense = 0;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3);

    this.transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const tDate = new Date(t.transactionDate);
      const tYear = tDate.getFullYear();
      const tMonth = tDate.getMonth();
      const tQuarter = Math.floor(tMonth / 3);

      let matches = false;
      if (this.chartTimePeriod === 'all') {
        matches = true;
      } else if (this.chartTimePeriod === 'year') {
        matches = (tYear === currentYear);
      } else if (this.chartTimePeriod === 'quarter') {
        matches = (tYear === currentYear && tQuarter === currentQuarter);
      } else if (this.chartTimePeriod === 'month') {
        matches = (tYear === currentYear && tMonth === currentMonth);
      }

      if (matches) {
        if (t.type === 'Income') {
          filteredIncome += amt;
        } else if (t.type === 'Expense') {
          filteredExpense += amt;
        }
      }
    });

    return { income: filteredIncome, expense: filteredExpense };
  }

  setChartTimePeriod(period: 'year' | 'quarter' | 'month' | 'all') {
    this.chartTimePeriod = period;
    this.renderIncomeExpenseChart();
  }

  renderIncomeExpenseChart() {
    const canvas = document.getElementById('incomeExpenseChart') as HTMLCanvasElement;
    if (!canvas) {
      console.warn('Income vs Expense canvas not found');
      return;
    }

    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.destroy();
    }

    const totals = this.getChartTotals();
    const ctx = canvas.getContext('2d');
    
    let incomeBg: any = '#10b981';
    let expenseBg: any = '#ef4444';
    let incomeBorder: any = '#059669';
    let expenseBorder: any = '#dc2626';

    if (ctx) {
      const height = canvas.clientHeight || canvas.height || 200;
      
      // Income: Emerald green (#34d399) fading to deep mint (#065f46)
      const g1 = ctx.createLinearGradient(0, 0, 0, height);
      g1.addColorStop(0, '#34d399');
      g1.addColorStop(1, '#065f46');
      incomeBg = g1;

      // Expense: Coral red (#f87171) fading to dark crimson (#991b1b)
      const g2 = ctx.createLinearGradient(0, 0, 0, height);
      g2.addColorStop(0, '#f87171');
      g2.addColorStop(1, '#991b1b');
      expenseBg = g2;
    }

    this.incomeExpenseChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Income', 'Expense'],
        datasets: [
          {
            label: 'Amount (₹)',
            data: [totals.income, totals.expense],
            backgroundColor: [incomeBg, expenseBg],
            borderColor: [incomeBorder, expenseBorder],
            borderWidth: 1,
            borderRadius: {
              topLeft: 8,
              topRight: 8,
              bottomLeft: 0,
              bottomRight: 0
            },
            barThickness: 32,
            maxBarThickness: 40
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#94a3b8',
              callback: function(value: any) {
                return '₹' + Number(value).toLocaleString('en-IN');
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#cbd5e1',
              font: {
                weight: 600
              }
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1A1D28',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#2D3243',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            cornerRadius: 8,
            callbacks: {
              title: (tooltipItems) => {
                return tooltipItems[0].label;
              },
              label: (context) => {
                const val = context.raw as number;
                return `₹${val.toLocaleString('en-IN')}`;
              }
            }
          }
        }
      }
    });
  }

  calculateMetrics() {
    let income = 0;
    let expense = 0;
    this.transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === 'Income') {
        income += amt;
      } else if (t.type === 'Expense') {
        expense += amt;
      }
    });
    this.totalIncome = income;
    this.totalExpense = expense;
    this.savings = income - expense;
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  goIncome() {
    this.router.navigate(['/income']);
  }

  goExpense() {
    this.router.navigate(['/expense']);
  }

  goTransactions() {
    this.router.navigate(['/transactions']);
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}