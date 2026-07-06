import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {

  username = '';
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';
  country = '';
  incomeBracket = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  createAccount() {

    this.api.register({
      username: this.username,
      fullName: this.fullName,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      country: this.country,
      incomeBracket: this.incomeBracket,
      role: 'Employee'
    }).subscribe({
      next: (res) => {
        alert('Account Created Successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log('ERROR:', err);
        console.log('ERROR BODY:', err.error);
        alert(JSON.stringify(err.error));
      }
    });

  }

}