import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-budgets',
  imports: [FormsModule, RouterLink],
  templateUrl: './budgets.html',
  styleUrl: './budgets.css'
})
export class Budgets implements OnInit {
  budgets: any[] = [];
  isLoading = false;
  errorMessage = '';
  userName = 'Freelancer';
  isLightTheme = false;

  // Budget Editor properties
  editingCategory = '';
  editingLimit: number | null = null;
  editingDescription = '';
  isSavingBudget = false;

  // New budget creation
  newCategory = '';
  newBudgetLimit: number | null = null;
  newMonth = '';
  newDescription = '';
  isCreatingBudget = false;

  // Available categories for selector
  expenseCategories: string[] = [];
  incomeCategories: string[] = [];

  // Monthly navigation properties
  selectedViewMonth = '';
  minMonthStr = '';
  showCreateModal = false;

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
    
    // Set default month to current month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    this.selectedViewMonth = `${currentYear}-${currentMonth}`;
    this.minMonthStr = `${currentYear}-${currentMonth}`;
    this.newMonth = this.selectedViewMonth;

    this.loadBudgetsAndSettings();
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

  loadBudgetsAndSettings() {
    this.isLoading = true;
    this.errorMessage = '';

    // First load categories from API
    this.api.getCategories().subscribe({
      next: (catRes: any) => {
        let categories = [];
        if (catRes && catRes.data) {
          categories = catRes.data;
        } else if (Array.isArray(catRes)) {
          categories = catRes;
        } else if (catRes && Array.isArray(catRes.categories)) {
          categories = catRes.categories;
        }

        if (categories.length > 0) {
          this.expenseCategories = categories.filter((c: any) => c.type === 'expense').map((c: any) => c.name);
          this.incomeCategories = categories.filter((c: any) => c.type === 'income').map((c: any) => c.name);
        } else {
          this.setDefaultFallbackCategories();
        }

        this.fetchBudgetsAndMap();
      },
      error: (err: any) => {
        console.error('Error loading categories in budgets page:', err);
        this.setDefaultFallbackCategories();
        this.fetchBudgetsAndMap();
      }
    });
  }

  setDefaultFallbackCategories() {
    this.expenseCategories = [
      'Office Supplies',
      'Software/SaaS',
      'Hardware/Gadgets',
      'Travel/Meals',
      'Marketing/Ads',
      'Other'
    ];
    this.incomeCategories = [
      'Freelance Project',
      'Consulting',
      'Contract Work',
      'Royalties',
      'Ad Revenue',
      'Other'
    ];
  }

  fetchBudgetsAndMap() {
    this.api.getBudgets(this.selectedViewMonth).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.data) {
          const fetchedBudgets = res.data.budgets || [];
          
          // Filter to only display budgets that have a set limit (added by the user)
          this.budgets = fetchedBudgets.filter((b: any) => b.limit > 0);

          // Sort budgets so that set limits appear first
          this.budgets.sort((a, b) => b.limit - a.limit);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Error loading budget details:', err);
        if (err.status === 401) {
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
          this.router.navigate(['/']);
        } else {
          this.errorMessage = 'Failed to load budget data. Please try again.';
        }
      }
    });
  }

  // Edit action
  startEditBudget(category: string, currentLimit: number) {
    this.editingCategory = category;
    this.editingLimit = currentLimit > 0 ? currentLimit : null;
    
    // Find description
    const found = this.budgets.find(b => b.category === category);
    this.editingDescription = found ? (found.description || '') : '';
  }

  cancelEditBudget() {
    this.editingCategory = '';
    this.editingLimit = null;
    this.editingDescription = '';
  }

  saveBudgetLimit() {
    if (this.editingLimit === null || this.editingLimit === undefined || this.editingLimit < 0) {
      alert('Please enter a valid positive budget limit');
      return;
    }

    this.isSavingBudget = true;
    const payload = {
      category: this.editingCategory,
      limit: Number(this.editingLimit),
      month: this.selectedViewMonth,
      description: this.editingDescription
    };

    this.api.updateBudget(payload).subscribe({
      next: () => {
        this.isSavingBudget = false;
        this.editingCategory = '';
        this.editingLimit = null;
        this.editingDescription = '';
        this.loadBudgetsAndSettings();
      },
      error: (err: any) => {
        this.isSavingBudget = false;
        console.error('Error saving budget limit:', err);
        alert('Failed to save budget limit. Please try again.');
      }
    });
  }

  deleteBudgetLimit(category: string) {
    if (confirm(`Are you sure you want to remove the budget limit for ${category}?`)) {
      this.api.deleteBudget(category, this.selectedViewMonth).subscribe({
        next: () => {
          this.loadBudgetsAndSettings();
        },
        error: (err: any) => {
          console.error('Error deleting budget limit:', err);
          alert('Failed to delete budget limit. Please try again.');
        }
      });
    }
  }

  openCreateModal() {
    this.showCreateModal = true;
    this.newCategory = '';
    this.newBudgetLimit = null;
    this.newMonth = this.selectedViewMonth;
    this.newDescription = '';
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  getCurrentMonthStr(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  getAvailableCategories(): string[] {
    // Filter expense categories to only show those that do not currently have a set budget limit > 0
    return this.expenseCategories.filter(cat => {
      const budget = this.budgets.find(b => b.category === cat);
      return !budget || budget.limit === 0;
    });
  }

  onViewMonthChange() {
    this.loadBudgetsAndSettings();
  }

  formatMonthDisplay(monthStr: string): string {
    if (!monthStr || !monthStr.includes('-')) return monthStr;
    const parts = monthStr.split('-');
    const year = parts[0];
    const monthNum = parseInt(parts[1], 10);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[monthNum - 1]} ${year}`;
  }

  createNewBudget() {
    if (!this.newCategory) {
      alert('Please select a category');
      return;
    }

    if (this.newBudgetLimit === null || this.newBudgetLimit === undefined || this.newBudgetLimit < 0) {
      alert('Please enter a valid budget limit');
      return;
    }

    if (!this.newMonth) {
      alert('Please select a month');
      return;
    }

    const currentMonth = this.getCurrentMonthStr();
    if (this.newMonth < currentMonth) {
      alert('You can only create budgets for the current month or future months');
      return;
    }

    this.isCreatingBudget = true;
    const payload = {
      category: this.newCategory,
      limit: Number(this.newBudgetLimit),
      month: this.newMonth,
      description: this.newDescription || ''
    };

    this.saveBudgetLimitOnCreation(payload);
  }

  saveBudgetLimitOnCreation(payload: { category: string; limit: number; month: string; description: string }) {
    this.api.updateBudget(payload).subscribe({
      next: () => {
        this.isCreatingBudget = false;
        this.showCreateModal = false;
        this.newCategory = '';
        this.newBudgetLimit = null;
        this.newMonth = '';
        this.newDescription = '';
        this.loadBudgetsAndSettings();
      },
      error: (err: any) => {
        this.isCreatingBudget = false;
        console.error('Error creating budget:', err);
        alert('Failed to create budget. Please try again.');
      }
    });
  }

  // Format helper
  formatCurrency(amount: number): string {
    return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
