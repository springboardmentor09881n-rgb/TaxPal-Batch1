import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  activeTab = 'profile';
  isLightTheme = false;
  
  // Profile data
  fullName = '';
  email = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  
  // Categories
  expenseCategories: any[] = [];
  
  incomeCategories: any[] = [];
  
  newExpenseCategory = '';
  newIncomeCategory = '';
  
  // Notifications
  emailNotifications = true;
  budgetAlerts = true;
  weeklyReports = false;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    console.log('Profile ngOnInit - savedTheme:', savedTheme);
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
      console.log('Profile - Applied light theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
      console.log('Profile - Applied dark theme');
    }
    console.log('Profile - isLightTheme:', this.isLightTheme);
    
    this.loadUserProfile();
    this.loadCategories();
  }

  toggleTheme() {
    console.log('Profile toggleTheme called - current isLightTheme:', this.isLightTheme);
    this.isLightTheme = !this.isLightTheme;
    console.log('Profile toggleTheme - new isLightTheme:', this.isLightTheme);
    if (this.isLightTheme) {
      document.body.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
      console.log('Profile - Switched to light theme');
    } else {
      document.body.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
      console.log('Profile - Switched to dark theme');
    }
  }

  loadUserProfile() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.fullName = user.fullName || '';
        this.email = user.email || '';
      } catch (e) {
        console.error('Error parsing user storage:', e);
      }
    }
  }

  loadCategories() {
    this.api.getCategories().subscribe({
      next: (res: any) => {
        console.log('=== Category Loading Debug ===');
        console.log('Raw API response:', res);
        console.log('Response type:', typeof res);
        console.log('Response keys:', res ? Object.keys(res) : 'null/undefined');
        
        // Handle different response structures
        let categories = [];
        if (res && res.data) {
          categories = res.data;
        } else if (Array.isArray(res)) {
          categories = res;
        } else if (res && Array.isArray(res.categories)) {
          categories = res.categories;
        }
        
        console.log('Parsed categories array:', categories);
        console.log('Categories length:', categories.length);
        
        if (categories.length > 0) {
          console.log('First category sample:', categories[0]);
        }
        
        this.expenseCategories = categories.filter((c: any) => c.type === 'expense');
        this.incomeCategories = categories.filter((c: any) => c.type === 'income');
        
        console.log('Filtered expense categories:', this.expenseCategories);
        console.log('Filtered income categories:', this.incomeCategories);
        console.log('=== End Debug ===');
      },
      error: (err: any) => {
        console.error('Error loading categories:', err);
        // If no categories exist, initialize default ones
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
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Profile Settings
  updateProfile() {
    if (!this.fullName.trim()) {
      this.errorMessage = 'Full name is required';
      return;
    }

    this.isLoading = true;
    const payload = {
      fullName: this.fullName,
      email: this.email
    };

    this.api.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully';
        
        // Update local storage
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.fullName = this.fullName;
            user.email = this.email;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('Error updating local storage:', e);
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = 'Failed to update profile. Please try again.';
      }
    });
  }

  changePassword() {
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.errorMessage = 'All password fields are required';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'New passwords do not match';
      return;
    }

    if (this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.isLoading = true;
    const payload = {
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    };

    this.api.changePassword(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Password changed successfully';
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to change password. Please check your current password.';
      }
    });
  }

  // Category Management
  addExpenseCategory() {
    if (!this.newExpenseCategory.trim()) return;
    
    if (this.expenseCategories.some((c: any) => c.name === this.newExpenseCategory)) {
      this.errorMessage = 'Category already exists';
      return;
    }

    this.api.createCategory({
      name: this.newExpenseCategory,
      type: 'expense',
      color: '#6366f1',
      icon: 'tag'
    }).subscribe({
      next: () => {
        this.newExpenseCategory = '';
        this.successMessage = 'Category added successfully';
        this.loadCategories();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Failed to add category';
      }
    });
  }

  addIncomeCategory() {
    if (!this.newIncomeCategory.trim()) return;
    
    if (this.incomeCategories.some((c: any) => c.name === this.newIncomeCategory)) {
      this.errorMessage = 'Category already exists';
      return;
    }

    this.api.createCategory({
      name: this.newIncomeCategory,
      type: 'income',
      color: '#10b981',
      icon: 'tag'
    }).subscribe({
      next: () => {
        this.newIncomeCategory = '';
        this.successMessage = 'Category added successfully';
        this.loadCategories();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Failed to add category';
      }
    });
  }

  removeExpenseCategory(category: any) {
    if (this.expenseCategories.length <= 1) {
      this.errorMessage = 'Cannot remove the last category';
      return;
    }
    
    if (category.isDefault) {
      this.errorMessage = 'Cannot remove default categories';
      return;
    }
    
    this.api.deleteCategory(category._id).subscribe({
      next: () => {
        this.successMessage = 'Category removed successfully';
        this.loadCategories();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Failed to remove category';
      }
    });
  }

  removeIncomeCategory(category: any) {
    if (this.incomeCategories.length <= 1) {
      this.errorMessage = 'Cannot remove the last category';
      return;
    }
    
    if (category.isDefault) {
      this.errorMessage = 'Cannot remove default categories';
      return;
    }
    
    this.api.deleteCategory(category._id).subscribe({
      next: () => {
        this.successMessage = 'Category removed successfully';
        this.loadCategories();
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Failed to remove category';
      }
    });
  }


  // Notification Settings
  saveNotificationSettings() {
    const payload = {
      emailNotifications: this.emailNotifications,
      budgetAlerts: this.budgetAlerts,
      weeklyReports: this.weeklyReports
    };

    this.api.updateProfile(payload).subscribe({
      next: () => {
        this.successMessage = 'Notification settings saved';
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to save notification settings';
      }
    });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
