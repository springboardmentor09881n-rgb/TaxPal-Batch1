import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  transactions: any[] = [];
  isLoading = false;
  errorMessage = '';
  userName = 'Freelancer';

  totalIncome = 0;
  totalExpense = 0;
  savings = 0;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
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

  deleteTransaction(id: string) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.api.deleteTransaction(id).subscribe({
        next: () => {
          this.loadTransactions();
        },
        error: (err: any) => {
          console.error('Error deleting transaction:', err);
          alert('Failed to delete transaction. Please try again.');
        }
      });
    }
  }

  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  goIncome() {
    this.router.navigate(['/income']);
  }

  goExpense() {
    this.router.navigate(['/expense']);
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}