import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {

  email = '';
  password = '';

  emailError = '';
  passwordError = '';
  errorMessage = '';
  isLoading = false;
  isSubmitted = false;
  isLightTheme = false;

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
    }
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

  validateEmail() {
    this.emailError = '';
    if (!this.email) {
      this.emailError = 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(this.email)) {
        this.emailError = 'Invalid email address';
      }
    }
  }

  validatePassword() {
    this.passwordError = '';
    if (!this.password) {
      this.passwordError = 'Password is required';
    }
  }

  onEmailInput() {
    if (this.isSubmitted || this.emailError) {
      this.validateEmail();
    }
    this.errorMessage = '';
  }

  onPasswordInput() {
    if (this.isSubmitted || this.passwordError) {
      this.validatePassword();
    }
    this.errorMessage = '';
  }

  login() {
    this.isSubmitted = true;
    this.validateEmail();
    this.validatePassword();

    if (this.emailError || this.passwordError) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.api.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.data && res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          if (res.data.accessToken) {
            localStorage.setItem('accessToken', res.data.accessToken);
          }
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Login error:', err);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
        } else {
          this.errorMessage = 'Invalid email or password. Please try again.';
        }
      }
    });
  }
}