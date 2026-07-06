import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-expense',
  imports: [],
  templateUrl: './expense.html',
  styleUrl: './expense.css',
})
export class Expense {

  constructor(private router: Router) {}

  saveExpense() {
    alert('Expense Saved Successfully');
    this.router.navigate(['/dashboard']);
  }

}