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

  fullName = '';
  username = '';
  userId = '';
  email = '';
  password = '';
  confirmPassword = '';
  country = '';
  phone = '';
  state = '';
  city = '';
  language = '';
  incomeBracket = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  createAccount() {

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!passwordRegex.test(this.password)) {
      alert(
        'Password must contain at least 8 characters, 1 uppercase letter and 1 number'
      );
      return;
    }

    this.api.register({
      fullName: this.fullName,
      username: this.username,
      email: this.email,
      password: this.password,
      confirmPassword: this.confirmPassword,
      country: this.country,
      phone: this.phone,
      state: this.state,
      city: this.city,
      language: this.language,
      incomeBracket: this.incomeBracket,
      role: 'Employee'
    }).subscribe({
      next: () => {
        alert('Account Created Successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log(err);
        alert(JSON.stringify(err.error));
      }
    });
  }
}