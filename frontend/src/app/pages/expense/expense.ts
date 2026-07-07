import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-expense',
  imports: [FormsModule, RouterLink],
  templateUrl: './expense.html',
  styleUrl: './expense.css',
})
export class Expense implements OnInit {

  description = '';
  amount: number | null = null;
  transactionDate = '';
  category = 'Office Supplies';
  notes = '';

  descriptionError = '';
  amountError = '';
  categoryError = '';
  dateError = '';
  errorMessage = '';
  isLoading = false;
  isSubmitted = false;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.transactionDate = `${yyyy}-${mm}-${dd}`;
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

  saveExpense() {
    this.isSubmitted = true;
    if (!this.validateForm()) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      type: 'Expense',
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
        console.error('Error saving expense:', err);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Failed to save expense. Please try again.';
        }
      }
    });
  }
}