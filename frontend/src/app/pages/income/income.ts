import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-income',
  imports: [],
  templateUrl: './income.html',
  styleUrl: './income.css',
})
export class Income {

  constructor(private router: Router) {}

  saveIncome() {
    alert('Income Saved Successfully');
    this.router.navigate(['/dashboard']);
  }

}