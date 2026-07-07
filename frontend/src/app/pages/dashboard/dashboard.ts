import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {

  transactions: any[] = [];

  totalIncome = 0;
  totalExpense = 0;
  savings = 0;

  constructor(
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.api.getTransactions().subscribe({
      next: (res: any) => {

        this.transactions = res.data;

        this.totalIncome = this.transactions
          .filter((t: any) => t.type === 'Income')
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        this.totalExpense = this.transactions
          .filter((t: any) => t.type === 'Expense')
          .reduce((sum: number, t: any) => sum + t.amount, 0);

        this.savings = this.totalIncome - this.totalExpense;
      },
      error: (err) => {
        console.log(err);
      }
    });
  }

  goIncome() {
    this.router.navigate(['/income']);
  }

  goExpense() {
    this.router.navigate(['/expense']);
  }

}