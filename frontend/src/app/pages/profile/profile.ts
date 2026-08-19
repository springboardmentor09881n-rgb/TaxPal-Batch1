import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Dropdown } from '../../components/dropdown/dropdown';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, RouterLink, Dropdown],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile implements OnInit {
  activeTab = 'profile';
  isLightTheme = false;

  // Static options lists for custom dropdowns
  countriesList = ['United States', 'Canada', 'United Kingdom', 'Australia', 'India', 'Germany', 'France', 'Other'];
  languagesList = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese', 'Hindi'];
  incomeBracketsList = [
    { value: '<25k', label: '< 25k' },
    { value: '25k-50k', label: '25k - 50k' },
    { value: '50k-100k', label: '50k - 100k' },
    { value: '100k-150k', label: '100k - 150k' },
    { value: '150k+', label: '150k+' }
  ];
  currenciesList = [
    { value: 'INR', label: 'Indian Rupees (₹)' },
    { value: 'USD', label: 'US Dollars ($)' },
    { value: 'GBP', label: 'British Pounds (£)' },
    { value: 'EUR', label: 'Euros (€)' }
  ];
  
  // Profile data
  fullName = '';
  email = '';
  username = '';
  phone = '';
  city = '';
  state = '';
  country = '';
  language = '';
  incomeBracket = '';
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  currencyPreference = 'INR';
  twoFactorEnabled = false;
  twoFactorMethod = 'app';

  // 2FA Setup Mock Modal
  show2faModal = false;
  verificationCode2fa = '';

  // Active Sessions
  deviceSessions: any[] = [];
  
  // Category Customizations & Editing
  editingCategory: any = null;
  availableIcons = ['tag', 'shopping-cart', 'home', 'car', 'gift', 'book', 'lock', 'phone', 'briefcase', 'users', 'megaphone', 'laptop', 'plane', 'cpu', 'coffee', 'heart'];
  
  // Country to states mappings
  countryStates: Record<string, string[]> = {
    'India': ['Telangana', 'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal'],
    'United States': ['California', 'Texas', 'New York', 'Florida', 'Washington', 'Illinois', 'Pennsylvania', 'Ohio'],
    'Canada': ['Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia']
  };
  
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
    this.loadSessions();
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
        this.username = user.username || '';
        this.phone = user.phone || '';
        this.city = user.city || '';
        this.state = user.state || '';
        this.country = user.country || '';
        this.language = user.language || 'English';
        this.incomeBracket = user.incomeBracket || '';
        this.currencyPreference = user.currencyPreference || 'INR';
        this.twoFactorEnabled = user.twoFactorEnabled || false;
        this.twoFactorMethod = user.twoFactorMethod || 'app';
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
      email: this.email,
      username: this.username,
      phone: this.phone,
      city: this.city,
      state: this.state,
      country: this.country,
      language: this.language,
      incomeBracket: this.incomeBracket,
      currencyPreference: this.currencyPreference
    };

    this.api.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.successMessage = 'Profile updated successfully';
        
        // Update local storage
        if (res.data && res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          this.loadUserProfile();
        } else {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              user.fullName = this.fullName;
              user.email = this.email;
              user.username = this.username;
              user.phone = this.phone;
              user.city = this.city;
              user.state = this.state;
              user.country = this.country;
              user.language = this.language;
              user.incomeBracket = this.incomeBracket;
              user.currencyPreference = this.currencyPreference;
              localStorage.setItem('user', JSON.stringify(user));
            } catch (e) {
              console.error('Error updating local storage:', e);
            }
          }
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to update profile. Please try again.';
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

  // Country dynamic states resolver getter
  get availableStates(): string[] {
    return this.countryStates[this.country] || [];
  }

  onCountryChange() {
    const states = this.availableStates;
    if (states.length > 0) {
      this.state = states[0];
    } else {
      this.state = '';
    }
  }

  // Password strength calculation getter
  get passwordStrength(): { score: number; label: string; color: string } {
    const p = this.newPassword || '';
    if (!p) return { score: 0, label: '', color: 'transparent' };
    if (p.length < 6) return { score: 1, label: 'Weak', color: '#ef4444' };
    
    const hasLetters = /[a-zA-Z]/.test(p);
    const hasNumbers = /[0-9]/.test(p);
    const hasCaps = /[A-Z]/.test(p);
    const hasSpecial = /[^A-Za-z0-9]/.test(p);
    
    if (p.length >= 8 && hasLetters && hasNumbers && hasCaps && hasSpecial) {
      return { score: 3, label: 'Strong', color: '#10b981' };
    }
    if (p.length >= 6 && hasLetters && hasNumbers) {
      return { score: 2, label: 'Medium', color: '#f59e0b' };
    }
    return { score: 1, label: 'Weak', color: '#ef4444' };
  }

  // 2FA setups
  toggle2faSetting() {
    if (this.twoFactorEnabled) {
      // Show setup modal when user toggles switch to true
      this.show2faModal = true;
      this.twoFactorEnabled = false; // keep false until verified
    } else {
      this.save2faSetting(false);
    }
  }

  verifyAndEnable2fa() {
    if (this.verificationCode2fa.trim().length === 6) {
      this.show2faModal = false;
      this.twoFactorEnabled = true;
      this.save2faSetting(true);
      this.successMessage = '2FA configured successfully';
      this.verificationCode2fa = '';
    } else {
      alert('Invalid authentication code. Please enter a 6-digit verification code.');
    }
  }

  cancel2faSetup() {
    this.show2faModal = false;
    this.twoFactorEnabled = false;
    this.verificationCode2fa = '';
  }

  save2faSetting(enabled: boolean) {
    const payload = {
      twoFactorEnabled: enabled,
      twoFactorMethod: this.twoFactorMethod
    };
    this.api.updateProfile(payload).subscribe({
      next: (res: any) => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            user.twoFactorEnabled = enabled;
            user.twoFactorMethod = this.twoFactorMethod;
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('Error saving 2FA to local storage:', e);
          }
        }
      },
      error: () => {
        this.errorMessage = 'Failed to save 2FA preferences';
      }
    });
  }

  // Active session logging details
  loadSessions() {
    this.api.getActiveSessions().subscribe({
      next: (res: any) => {
        this.deviceSessions = res.data || [];
      },
      error: (err) => {
        console.error('Failed to load device logs:', err);
      }
    });
  }

  logoutOthers() {
    if (confirm('Are you sure you want to log out all other active sessions?')) {
      this.api.logoutOthers().subscribe({
        next: () => {
          this.successMessage = 'Other active sessions terminated successfully';
          this.loadSessions();
        },
        error: (err) => {
          this.errorMessage = 'Failed to revoke other active sessions';
        }
      });
    }
  }

  // Category Edit settings
  startEditCategory(cat: any) {
    this.editingCategory = { ...cat };
  }

  cancelEditCategory() {
    this.editingCategory = null;
  }

  saveCategoryEdit() {
    if (!this.editingCategory) return;
    this.api.updateCategory(this.editingCategory._id, {
      name: this.editingCategory.name,
      color: this.editingCategory.color,
      icon: this.editingCategory.icon,
      taxDeductible: this.editingCategory.taxDeductible
    }).subscribe({
      next: () => {
        this.editingCategory = null;
        this.successMessage = 'Category updated successfully';
        this.loadCategories();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update category';
      }
    });
  }

  toggleDeductibleInline(cat: any) {
    const newVal = !cat.taxDeductible;
    this.api.updateCategory(cat._id, { taxDeductible: newVal }).subscribe({
      next: () => {
        cat.taxDeductible = newVal;
        this.successMessage = 'Tax deductible preference updated';
      },
      error: (err) => {
        this.errorMessage = 'Failed to update category deductible status';
      }
    });
  }

  // Drag & Drop Category sorting
  draggedItemIndex: number | null = null;
  draggedType: 'expense' | 'income' | null = null;

  onDragStart(index: number, type: 'expense' | 'income') {
    this.draggedItemIndex = index;
    this.draggedType = type;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onDrop(index: number, type: 'expense' | 'income') {
    if (this.draggedItemIndex === null || this.draggedType !== type) return;

    const list = type === 'expense' ? this.expenseCategories : this.incomeCategories;
    const draggedItem = list[this.draggedItemIndex];

    list.splice(this.draggedItemIndex, 1);
    list.splice(index, 0, draggedItem);

    this.draggedItemIndex = null;
    this.draggedType = null;

    // Persist new sort positions to database
    list.forEach((cat: any, i: number) => {
      cat.sortOrder = i;
      this.api.updateCategory(cat._id, { sortOrder: i }).subscribe({
        error: (err) => console.error('Failed to update category sortOrder:', err)
      });
    });

    this.successMessage = 'Categories reordered successfully';
  }
}
