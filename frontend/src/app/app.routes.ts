import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Dashboard } from './pages/dashboard/dashboard';
import { Income } from './pages/income/income';
import { Expense } from './pages/expense/expense';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'signup', component: Signup },
  { path: 'dashboard', component: Dashboard },
  { path: 'income', component: Income },
  { path: 'expense', component: Expense }
];