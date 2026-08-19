import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';
import { Dropdown } from '../../components/dropdown/dropdown';

@Component({
  selector: 'app-transactions',
  imports: [FormsModule, RouterLink, CommonModule, Dropdown],
  templateUrl: './transactions.html',
  styleUrl: './transactions.css',
})
export class Transactions implements OnInit {

  // Static/dynamic dropdown helpers
  get currentCategoriesList(): any[] {
    const list = this.transactionType === 'Expense' ? this.expenseCategories : this.incomeCategories;
    return list.map((c: any) => ({ value: c.name, label: c.name }));
  }

  get editCategoriesList(): any[] {
    const list = this.editTransactionType === 'Expense' ? this.expenseCategories : this.incomeCategories;
    return list.map((c: any) => ({ value: c.name, label: c.name }));
  }

  get filterCategoriesList(): any[] {
    const list = [{ value: '', label: 'All Categories' }];
    this.incomeCategories.forEach(c => {
      list.push({ value: c.name, label: `${c.name} (Income)` });
    });
    this.expenseCategories.forEach(c => {
      list.push({ value: c.name, label: `${c.name} (Expense)` });
    });
    return list;
  }

  filterTypesList = [
    { value: '', label: 'All Types' },
    { value: 'Income', label: 'Income' },
    { value: 'Expense', label: 'Expense' }
  ];

  transactions: any[] = [];
  isLoading = false;
  errorMessage = '';
  userName = 'Freelancer';
  isLightTheme = false;

  // Search & Filter controls
  searchQuery = '';
  filterType = '';
  filterCategory = '';
  filterStartDate = '';
  filterEndDate = '';

  // Add transaction form
  showAddForm = false;
  showSmartScan = false;
  selectedFile: File | null = null;
  filePreview: string | null = null;
  isScanning = false;
  scanError = '';
  scanSuccess = false;

  transactionType = 'Income';
  description = '';
  amount: number | null = null;
  transactionDate = '';
  category = 'Freelance Project';
  notes = '';
  receiptImage = '';

  // Edit transaction state
  isEditing = false;
  editingTransactionId = '';
  editTransactionType = 'Income';
  editDescription = '';
  editAmount: number | null = null;
  editTransactionDate = '';
  editCategory = '';
  editNotes = '';

  // Edit validations
  editDescriptionError = '';
  editAmountError = '';
  editCategoryError = '';
  editDateError = '';
  isEditFormSubmitted = false;
  isEditFormLoading = false;

  // Receipt preview modal state
  showPreviewModal = false;
  previewReceiptImage = '';

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
      notes: this.notes.trim() || undefined,
      receiptImage: this.receiptImage || undefined
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
    this.showSmartScan = false;
    this.selectedFile = null;
    this.filePreview = null;
    this.isScanning = false;
    this.scanError = '';
    this.scanSuccess = false;
    this.description = '';
    this.amount = null;
    this.transactionDate = new Date().toISOString().split('T')[0];
    this.setDefaultCategory();
    this.notes = '';
    this.receiptImage = '';
    this.descriptionError = '';
    this.amountError = '';
    this.categoryError = '';
    this.dateError = '';
    this.isFormSubmitted = false;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.scanError = '';
      this.scanSuccess = false;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  scanReceipt() {
    if (!this.selectedFile) return;

    this.isScanning = true;
    this.scanError = '';
    this.scanSuccess = false;

    this.api.scanReceipt(this.selectedFile).subscribe({
      next: (res: any) => {
        this.isScanning = false;
        if (res.success && res.data) {
          this.scanSuccess = true;
          
          // Pre-fill the Add Transaction form
          this.transactionType = res.data.transactionType || 'Expense';
          this.description = res.data.description || '';
          this.amount = res.data.amount || null;
          this.transactionDate = res.data.date || new Date().toISOString().split('T')[0];
          this.notes = 'Scanned from receipt: ' + this.selectedFile?.name;
          this.receiptImage = this.filePreview || '';

          // Set category in the next tick to prevent Angular binding race condition
          setTimeout(() => {
            this.category = res.data.category || 'Other';
          }, 0);

          // Open the Add Transaction form so they can see and review the details
          this.showAddForm = true;
          this.showSmartScan = false; // close scanner panel
          this.selectedFile = null; // reset
        } else {
          this.scanError = 'Failed to extract data. Please manually enter the details.';
        }
      },
      error: (err: any) => {
        this.isScanning = false;
        this.scanError = err.error?.message || 'Error scanning receipt. Make sure the file is clear and < 5MB.';
      }
    });
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

  get filteredTransactions(): any[] {
    return this.transactions.filter(t => {
      // 1. Text Search by description/notes
      if (this.searchQuery.trim()) {
        const query = this.searchQuery.toLowerCase();
        const descMatch = t.description?.toLowerCase().includes(query);
        const notesMatch = t.notes?.toLowerCase().includes(query);
        if (!descMatch && !notesMatch) return false;
      }

      // 2. Filter by Type
      if (this.filterType) {
        if (t.type !== this.filterType) return false;
      }

      // 3. Filter by Category
      if (this.filterCategory) {
        if (t.category !== this.filterCategory) return false;
      }

      // 4. Filter by Date Range
      if (this.filterStartDate) {
        const start = new Date(this.filterStartDate);
        const tDate = new Date(t.transactionDate);
        if (tDate < start) return false;
      }
      if (this.filterEndDate) {
        const end = new Date(this.filterEndDate);
        end.setHours(23, 59, 59, 999);
        const tDate = new Date(t.transactionDate);
        if (tDate > end) return false;
      }

      return true;
    });
  }

  openEditModal(t: any) {
    this.isEditing = true;
    this.editingTransactionId = t._id;
    this.editTransactionType = t.type;
    this.editDescription = t.description;
    this.editAmount = t.amount;
    
    if (t.transactionDate) {
      const dateObj = new Date(t.transactionDate);
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      this.editTransactionDate = `${yyyy}-${mm}-${dd}`;
    } else {
      this.editTransactionDate = '';
    }
    
    this.editCategory = t.category;
    this.editNotes = t.notes || '';

    this.editDescriptionError = '';
    this.editAmountError = '';
    this.editCategoryError = '';
    this.editDateError = '';
    this.isEditFormSubmitted = false;
  }

  closeEditModal() {
    this.isEditing = false;
    this.editingTransactionId = '';
    this.isEditFormSubmitted = false;
  }

  validateEditForm(): boolean {
    this.editDescriptionError = '';
    this.editAmountError = '';
    this.editCategoryError = '';
    this.editDateError = '';

    if (!this.editDescription.trim()) {
      this.editDescriptionError = 'Description is required';
    }
    if (this.editAmount === null || this.editAmount === undefined || this.editAmount <= 0) {
      this.editAmountError = 'Please enter a valid positive amount';
    }
    if (!this.editCategory.trim()) {
      this.editCategoryError = 'Category is required';
    }
    if (!this.editTransactionDate) {
      this.editDateError = 'Transaction date is required';
    }

    return !this.editDescriptionError && !this.editAmountError && !this.editCategoryError && !this.editDateError;
  }

  updateTransaction() {
    this.isEditFormSubmitted = true;
    if (!this.validateEditForm()) {
      return;
    }

    this.isEditFormLoading = true;
    this.errorMessage = '';

    const payload = {
      type: this.editTransactionType,
      description: this.editDescription.trim(),
      category: this.editCategory,
      amount: Number(this.editAmount),
      transactionDate: this.editTransactionDate,
      notes: this.editNotes.trim() || undefined
    };

    this.api.updateTransaction(this.editingTransactionId, payload).subscribe({
      next: () => {
        this.isEditFormLoading = false;
        this.closeEditModal();
        this.loadTransactions();
      },
      error: (err: any) => {
        this.isEditFormLoading = false;
        console.error('Error updating transaction:', err);
        this.errorMessage = err.error?.message || 'Failed to update transaction. Please try again.';
      }
    });
  }

  openReceiptPreview(image: string) {
    this.previewReceiptImage = image;
    this.showPreviewModal = true;
  }

  closeReceiptPreview() {
    this.showPreviewModal = false;
    this.previewReceiptImage = '';
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
