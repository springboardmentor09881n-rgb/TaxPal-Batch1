import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-signup',
  imports: [FormsModule, RouterLink],
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
  phone = '';
  state = '';
  city = '';
  language = 'English';
  incomeBracket = '';

  fullNameError = '';
  usernameError = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  countryError = '';
  errorMessage = '';
  isLoading = false;
  isSubmitted = false;

  passwordStrength = 0;
  passwordStrengthText = '';
  passwordStrengthClass = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  checkPasswordStrength() {
    const p = this.password;
    if (!p) {
      this.passwordStrength = 0;
      this.passwordStrengthText = '';
      this.passwordStrengthClass = '';
      return;
    }

    let score = 0;

    // Rule 1: Min 8 characters
    if (p.length >= 8) {
      score++;
    }

    // Rule 2: At least 1 uppercase letter
    if (/[A-Z]/.test(p)) {
      score++;
    }

    // Rule 3: At least 1 number
    if (/[0-9]/.test(p)) {
      score++;
    }

    this.passwordStrength = score;

    if (score === 1) {
      this.passwordStrengthText = 'Weak (Must be 8+ characters, with 1 uppercase letter and 1 number)';
      this.passwordStrengthClass = 'strength-weak';
    } else if (score === 2) {
      this.passwordStrengthText = 'Medium (Almost there)';
      this.passwordStrengthClass = 'strength-medium';
    } else if (score >= 3) {
      this.passwordStrengthText = 'Strong';
      this.passwordStrengthClass = 'strength-strong';
    } else {
      this.passwordStrengthText = 'Weak';
      this.passwordStrengthClass = 'strength-weak';
    }
  }

  checkConfirmPassword() {
    this.confirmPasswordError = '';
    if (this.confirmPassword && this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
    }
  }

  validateFullName() {
    this.fullNameError = '';
    if (!this.fullName.trim()) {
      this.fullNameError = 'Full name is required';
    }
  }

  validateUsername() {
    this.usernameError = '';
    const trimmed = this.username.trim();
    if (!trimmed) {
      this.usernameError = 'Username is required';
    } else if (trimmed.length < 6) {
      this.usernameError = 'Username must be at least 6 characters';
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
    } else {
      if (this.password.length < 8) {
        this.passwordError = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(this.password)) {
        this.passwordError = 'Password must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(this.password)) {
        this.passwordError = 'Password must contain at least one number';
      }
    }
  }

  validateCountry() {
    this.countryError = '';
    if (!this.country) {
      this.countryError = 'Country is required';
    }
  }

  onFullNameInput() {
    if (this.isSubmitted || this.fullNameError) this.validateFullName();
    this.errorMessage = '';
  }

  onUsernameInput() {
    if (this.isSubmitted || this.usernameError) this.validateUsername();
    this.errorMessage = '';
  }

  onEmailInput() {
    if (this.isSubmitted || this.emailError) this.validateEmail();
    this.errorMessage = '';
  }

  onPasswordInput() {
    this.checkPasswordStrength();
    if (this.isSubmitted || this.passwordError) this.validatePassword();
    this.checkConfirmPassword();
    this.errorMessage = '';
  }

  onConfirmPasswordInput() {
    this.checkConfirmPassword();
    this.errorMessage = '';
  }

  onCountryInput() {
    if (this.isSubmitted || this.countryError) this.validateCountry();
    this.errorMessage = '';
  }

  get showStateField(): boolean {
    if (!this.country) return false;
    const c = this.country.toLowerCase().trim();
    return c === 'united states' || c === 'canada' || c === 'india' || c === 'australia' || c === 'usa';
  }

  createAccount() {
    this.isSubmitted = true;
    this.validateFullName();
    this.validateUsername();
    this.validateEmail();
    this.validatePassword();
    this.checkConfirmPassword();
    this.validateCountry();

    if (
      this.fullNameError ||
      this.usernameError ||
      this.emailError ||
      this.passwordError ||
      this.confirmPasswordError ||
      this.countryError
    ) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const payload = {
      username: this.username.trim(),
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
      confirmPassword: this.confirmPassword,
      country: this.country,
      phone: this.phone.trim() || undefined,
      state: this.showStateField ? this.state.trim() : undefined,
      city: this.city.trim() || undefined,
      language: this.language || undefined,
      incomeBracket: this.incomeBracket || undefined,
      role: 'Employee'
    };

    this.api.register(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res && res.data && res.data.user) {
          localStorage.setItem('user', JSON.stringify(res.data.user));
          if (res.data.accessToken) {
            localStorage.setItem('accessToken', res.data.accessToken);
          }
        }
        alert('Account Created Successfully');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Signup error:', err);
        if (err.error && err.error.message) {
          this.errorMessage = err.error.message;
          if (err.error.errors && Array.isArray(err.error.errors)) {
            err.error.errors.forEach((e: any) => {
              const fieldName = e.field.replace('body.', '');
              if (fieldName === 'username') this.usernameError = e.message;
              if (fieldName === 'email') this.emailError = e.message;
              if (fieldName === 'fullName') this.fullNameError = e.message;
              if (fieldName === 'password') this.passwordError = e.message;
              if (fieldName === 'confirmPassword') this.confirmPasswordError = e.message;
              if (fieldName === 'country') this.countryError = e.message;
            });
          }
        } else {
          this.errorMessage = 'An error occurred during registration. Please try again.';
        }
      }
    });
  }
}