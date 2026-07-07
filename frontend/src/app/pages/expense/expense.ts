import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-expense',
  imports: [FormsModule],
  templateUrl: './expense.html',
  styleUrl: './expense.css',
})
export class Expense {

  description = '';
  category = '';
  amount: number = 0;
  transactionDate = '';
  notes = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  saveExpense() {

    this.api.createTransaction({
      type: 'Expense',
      description: this.description,
      category: this.category,
      amount: Number(this.amount),
      transactionDate: this.transactionDate,
      notes: this.notes
    }).subscribe({
      next: () => {
        alert('Expense Saved Successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log(err);
        alert(JSON.stringify(err.error));
      }
    });

  }
}