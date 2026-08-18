import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-receipt-scanner',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './receipt-scanner.html',
  styleUrl: './receipt-scanner.css',
})
export class ReceiptScanner implements OnInit {
  isLightTheme = false;
  selectedFile: File | null = null;
  filePreview: string | null = null;
  
  isScanning = false;
  scanError = '';
  scanSuccess = false;

  // Extracted Details Form
  transactionType = 'Expense';
  description = '';
  amount: number | null = null;
  transactionDate = '';
  category = 'Food';
  currency = 'USD';
  
  isSubmitting = false;
  submitError = '';
  
  expenseCategories: any[] = [];
  incomeCategories: any[] = [];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    }
    
    this.loadCategories();
  }

  loadCategories() {
    this.api.getCategories().subscribe({
      next: (res: any) => {
        if (res.success && res.data) {
          this.expenseCategories = res.data.filter((c: any) => c.type === 'Expense');
          this.incomeCategories = res.data.filter((c: any) => c.type === 'Income');
        }
      },
      error: (err) => console.error('Failed to load categories', err)
    });
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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.scanError = '';
      this.scanSuccess = false;
      
      // Create preview
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
          this.transactionType = res.data.transactionType || 'Expense';
          this.description = res.data.description || '';
          this.amount = res.data.amount || null;
          this.transactionDate = res.data.date || '';
          this.category = res.data.category || 'Other';
          this.currency = res.data.currency || 'USD';
        } else {
          this.scanError = 'Failed to extract data. Please manually enter the details.';
        }
      },
      error: (err) => {
        this.isScanning = false;
        this.scanError = err.error?.message || 'Error scanning receipt. Make sure the file is clear and < 5MB.';
      }
    });
  }

  confirmTransaction() {
    this.submitError = '';
    
    if (!this.description || !this.amount || !this.transactionDate || !this.category) {
      this.submitError = 'Please fill in all required fields.';
      return;
    }

    this.isSubmitting = true;

    const payload = {
      type: this.transactionType,
      description: this.description,
      amount: this.amount,
      transactionDate: this.transactionDate,
      category: this.category,
      notes: 'Imported from Smart Receipt Scanner'
    };

    this.api.createTransaction(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.success) {
          this.router.navigate(['/transactions']);
        }
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitError = err.error?.message || 'Failed to create transaction.';
      }
    });
  }
}
