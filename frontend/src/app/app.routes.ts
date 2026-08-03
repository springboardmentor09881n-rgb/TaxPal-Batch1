import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Dashboard } from './pages/dashboard/dashboard';
import { Income } from './pages/income/income';
import { Expense } from './pages/expense/expense';
import { Budgets } from './pages/budgets/budgets';
import { Profile } from './pages/profile/profile';
import { Transactions } from './pages/transactions/transactions';
import { TaxEstimator } from './pages/tax-estimator/tax-estimator';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'signup', component: Signup },
  { path: 'dashboard', component: Dashboard },
  { path: 'income', component: Income },
  { path: 'expense', component: Expense },
  { path: 'budgets', component: Budgets },
  { path: 'profile', component: Profile },
  { path: 'transactions', component: Transactions },
  { path: 'tax-estimator', component: TaxEstimator }
];