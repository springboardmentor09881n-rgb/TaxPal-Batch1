import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-transactions',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {

  transactions: any[] = [];
  isLoading = false;
  errorMessage = '';
  userName = 'Freelancer';
  isLightTheme = false;

  // Add transaction form
  showAddForm = false;
  transactionType = 'Income';
  description = '';
  amount: number | null = null;
  transactionDate = '';
  category = 'Freelance Project';
  notes = '';

  descriptionError = '';
  amountError = '';
  categoryError = '';
  dateError = '';
  isFormSubmitted = false;
  isFormLoading = false;

  expenseCategories: any[] = [];
  incomeCategories: any[] = [];

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

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.transactionDate = `${yyyy}-${mm}-${dd}`;

    this.loadTransactions();
    this.loadCategories();
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

  loadCategories() {
    this.api.getCategories().subscribe({
      next: (res: any) => {
        let categories = [];
        if (res && res.data) {
          categories = res.data;
        } else if (Array.isArray(res)) {
          categories = res;
        } else if (res && Array.isArray(res.categories)) {
          categories = res.categories;
        }
        
        this.expenseCategories = categories.filter((c: any) => c.type === 'expense');
        this.incomeCategories = categories.filter((c: any) => c.type === 'income');
        
        if (categories.length === 0) {
          this.initializeDefaultCategories();
        } else {
          this.setDefaultCategory();
        }
      },
      error: (err: any) => {
        console.error('Error loading categories:', err);
        this.initializeDefaultCategories();
      }
    });
  }

  initializeDefaultCategories() {
    this.api.initializeDefaultCategories().subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (err: any) => {
        console.error('Error initializing default categories:', err);
        this.expenseCategories = [
          { name: 'Office Supplies' },
          { name: 'Software/SaaS' },
          { name: 'Hardware/Gadgets' },
          { name: 'Travel/Meals' },
          { name: 'Marketing/Ads' },
          { name: 'Other' }
        ];
        this.incomeCategories = [
          { name: 'Freelance Project' },
          { name: 'Consulting' },
          { name: 'Contract Work' },
          { name: 'Royalties' },
          { name: 'Ad Revenue' },
          { name: 'Other' }
        ];
        this.setDefaultCategory();
      }
    });
  }

  setDefaultCategory() {
    if (this.transactionType === 'Income') {
      this.category = this.incomeCategories.length > 0 ? this.incomeCategories[0].name : 'Freelance Project';
    } else {
      this.category = this.expenseCategories.length > 0 ? this.expenseCategories[0].name : 'Software/SaaS';
    }
  }

  onTransactionTypeChange() {
    this.setDefaultCategory();
  }

  validateAddForm(): boolean {
    this.descriptionError = '';
    this.amountError = '';
    this.categoryError = '';
    this.dateError = '';

    if (!this.description.trim()) {
      this.descriptionError = 'Description is required';
    }
    if (this.amount === null || this.amount === undefined || this.amount <= 0) {
      this.amountError = 'Please enter a valid positive amount';
    }
    if (!this.category.trim()) {
      this.categoryError = 'Category is required';
    }
    if (!this.transactionDate) {
      this.dateError = 'Transaction date is required';
    }

    return !this.descriptionError && !this.amountError && !this.categoryError && !this.dateError;
  }

  saveTransaction() {
    this.isFormSubmitted = true;
    if (!this.validateAddForm()) {
      return;
    }

    this.isFormLoading = true;
    this.errorMessage = '';

    const payload = {
      type: this.transactionType,
      description: this.description.trim(),
      category: this.category,
      amount: Number(this.amount),
      transactionDate: this.transactionDate,
      notes: this.notes.trim() || undefined
    };

    this.api.createTransaction(payload).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.resetForm();
        this.loadTransactions();
      },
      error: (err: any) => {
        this.isFormLoading = false;
        console.error('Error saving transaction:', err);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Failed to save transaction. Please try again.';
        }
      }
    });
  }

  resetForm() {
    this.showAddForm = false;
    this.description = '';
    this.amount = null;
    this.transactionDate = new Date().toISOString().split('T')[0];
    this.setDefaultCategory();
    this.notes = '';
    this.descriptionError = '';
    this.amountError = '';
    this.categoryError = '';
    this.dateError = '';
    this.isFormSubmitted = false;
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

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
