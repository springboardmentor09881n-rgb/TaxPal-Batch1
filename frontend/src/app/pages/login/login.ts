import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  email = '';
  password = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login() {

    this.api.login({
      email: this.email,
      password: this.password
    }).subscribe({
      next: () => {
        alert('Login Successful');
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.log(err);
        alert(JSON.stringify(err.error));
      }
    });

  }
}