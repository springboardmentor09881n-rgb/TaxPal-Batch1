import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-income',
  imports: [FormsModule],
  templateUrl: './income.html',
  styleUrl: './income.css',
})
export class Income {

  description = '';
  category = '';
  amount: number = 0;
  transactionDate = '';
  notes = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  saveIncome() {

    this.api.createTransaction({
      type: 'Income',
      description: this.description,
      category: this.category,
      amount: Number(this.amount),
      transactionDate: this.transactionDate,
      notes: this.notes
    }).subscribe({
      next: () => {
        alert('Income Saved Successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log(err);
        alert(JSON.stringify(err.error));
      }
    });

  }
}