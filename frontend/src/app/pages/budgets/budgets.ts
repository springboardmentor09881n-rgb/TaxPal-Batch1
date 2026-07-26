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
  isSavingBudget = false;

  // New budget creation
  newCategory = '';
  newBudgetLimit: number | null = null;
  isCreatingBudget = false;

  // Available categories for selector
  expenseCategories: string[] = [];
  incomeCategories: string[] = [];

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
    this.api.getBudgets().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.data) {
          const fetchedBudgets = res.data.budgets || [];
          
          // Ensure all active expense categories are represented, even if limit is 0
          this.budgets = this.expenseCategories.map(cat => {
            const found = fetchedBudgets.find((b: any) => b.category === cat);
            return found || {
              category: cat,
              limit: 0,
              spent: 0,
              remaining: 0,
              percentage: 0
            };
          });

          // Also make sure any fetched budgets that don't match our current list (if any edge cases exist) are included
          fetchedBudgets.forEach((b: any) => {
            if (!this.expenseCategories.includes(b.category)) {
              this.budgets.push({
                category: b.category,
                limit: b.limit,
                spent: b.spent,
                remaining: b.remaining,
                percentage: b.percentage
              });
            }
          });

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
  }

  cancelEditBudget() {
    this.editingCategory = '';
    this.editingLimit = null;
  }

  saveBudgetLimit() {
    if (this.editingLimit === null || this.editingLimit === undefined || this.editingLimit < 0) {
      alert('Please enter a valid positive budget limit');
      return;
    }

    this.isSavingBudget = true;
    const payload = {
      category: this.editingCategory,
      limit: Number(this.editingLimit)
    };

    this.api.updateBudget(payload).subscribe({
      next: () => {
        this.isSavingBudget = false;
        this.editingCategory = '';
        this.editingLimit = null;
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
      this.api.deleteBudget(category).subscribe({
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

  // Create new budget category
  createNewBudget() {
    if (!this.newCategory.trim()) {
      alert('Please enter a category name');
      return;
    }

    if (this.newBudgetLimit === null || this.newBudgetLimit === undefined || this.newBudgetLimit < 0) {
      alert('Please enter a valid budget limit');
      return;
    }

    this.isCreatingBudget = true;
    const payload = {
      category: this.newCategory.trim(),
      limit: Number(this.newBudgetLimit)
    };

    // First check if the category already exists in expenseCategories
    const categoryExists = this.expenseCategories.some(
      (cat: string) => cat.toLowerCase() === this.newCategory.trim().toLowerCase()
    );

    if (!categoryExists) {
      // Create the category first, then set the budget limit
      this.api.createCategory({
        name: this.newCategory.trim(),
        type: 'expense'
      }).subscribe({
        next: () => {
          this.saveBudgetLimitOnCreation(payload);
        },
        error: (err: any) => {
          console.error('Error creating category during budget creation:', err);
          // If it fails (maybe already exists in DB but not loaded), still try to set the budget limit
          this.saveBudgetLimitOnCreation(payload);
        }
      });
    } else {
      this.saveBudgetLimitOnCreation(payload);
    }
  }

  saveBudgetLimitOnCreation(payload: { category: string; limit: number }) {
    this.api.updateBudget(payload).subscribe({
      next: () => {
        this.isCreatingBudget = false;
        this.newCategory = '';
        this.newBudgetLimit = null;
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
