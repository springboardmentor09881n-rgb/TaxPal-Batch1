import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-income',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './income.html',
  styleUrl: './income.css',
})
export class Income implements OnInit {
  isLightTheme = false;

  description = '';
  amount: number | null = null;
  transactionDate = '';
  category = 'Freelance Project';
  notes = '';

  descriptionError = '';
  amountError = '';
  categoryError = '';
  dateError = '';
  errorMessage = '';
  isLoading = false;
  isSubmitted = false;

  autoCategorizeEnabled = true;
  categoryMappings: any[] = [];
  isAutoSuggested = false;
  incomeCategories: any[] = [];

  defaultMappings = [
    { keyword: 'project', category: 'Freelance Project' },
    { keyword: 'website', category: 'Freelance Project' },
    { keyword: 'freelance', category: 'Freelance Project' },
    { keyword: 'retainer', category: 'Contract Work' },
    { keyword: 'contract', category: 'Contract Work' },
    { keyword: 'consulting', category: 'Consulting' },
    { keyword: 'consult', category: 'Consulting' },
    { keyword: 'advisory', category: 'Consulting' },
    { keyword: 'royalty', category: 'Royalties' },
    { keyword: 'royalties', category: 'Royalties' },
    { keyword: 'book', category: 'Royalties' },
    { keyword: 'course', category: 'Royalties' },
    { keyword: 'youtube', category: 'Ad Revenue' },
    { keyword: 'ad', category: 'Ad Revenue' },
    { keyword: 'ads', category: 'Ad Revenue' }
  ];

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
    }
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.transactionDate = `${yyyy}-${mm}-${dd}`;
    this.loadSettings();
    this.loadCategories();
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
    this.category = this.incomeCategories.length > 0 ? this.incomeCategories[0].name : 'Freelance Project';
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

  loadSettings() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.autoCategorizeEnabled = user.autoCategorizeEnabled !== false;
        this.categoryMappings = user.categoryMappings?.length ? user.categoryMappings : this.defaultMappings;
      } catch (e) {
        this.autoCategorizeEnabled = true;
        this.categoryMappings = this.defaultMappings;
      }
    } else {
      this.autoCategorizeEnabled = true;
      this.categoryMappings = this.defaultMappings;
    }

    this.api.getBudgets().subscribe({
      next: (res: any) => {
        if (res && res.data && res.data.settings) {
          const settings = res.data.settings;
          this.autoCategorizeEnabled = settings.autoCategorizeEnabled !== false;
          if (settings.categoryMappings && settings.categoryMappings.length > 0) {
            this.categoryMappings = settings.categoryMappings;
          }
        }
      },
      error: (err: any) => {
        console.error('Error fetching budgets/settings on income page:', err);
      }
    });
  }

  onDescriptionInput() {
    if (!this.autoCategorizeEnabled) return;

    const desc = this.description.toLowerCase();
    if (!desc.trim()) {
      this.isAutoSuggested = false;
      return;
    }

    const match = this.categoryMappings.find(m => desc.includes(m.keyword.toLowerCase()));
    if (match) {
      this.category = match.category;
      this.isAutoSuggested = true;
    } else {
      this.isAutoSuggested = false;
    }
  }

  onCategoryChange() {
    this.isAutoSuggested = false;
  }

  validateForm(): boolean {
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

  saveIncome() {
    this.isSubmitted = true;
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      type: 'Income',
      description: this.description.trim(),
      category: this.category,
      amount: Number(this.amount),
      transactionDate: this.transactionDate,
      notes: this.notes.trim() || undefined
    };

    this.api.createTransaction(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error saving income:', err);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Failed to save income. Please try again.';
        }
      }
    });
  }
}