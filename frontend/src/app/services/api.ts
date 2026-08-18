import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  private getOptions() {
    const token = localStorage.getItem('accessToken');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return {
      headers,
      withCredentials: true
    };
  }

  login(data: any) {
    return this.http.post(`${this.baseUrl}/auth/login`, data);
  }

  register(data: any) {
    return this.http.post(`${this.baseUrl}/auth/register`, data);
  }

  getTransactions() {
    return this.http.get(`${this.baseUrl}/transactions`, this.getOptions());
  }

  createTransaction(data: any) {
    return this.http.post(`${this.baseUrl}/transactions`, data, this.getOptions());
  }

  deleteTransaction(id: string) {
    return this.http.delete(`${this.baseUrl}/transactions/${id}`, this.getOptions());
  }

  getBudgets(month?: string) {
    const url = month ? `${this.baseUrl}/budgets?month=${month}` : `${this.baseUrl}/budgets`;
    return this.http.get(url, this.getOptions());
  }

  updateBudget(data: { category: string; limit: number; month?: string; description?: string }) {
    return this.http.post(`${this.baseUrl}/budgets`, data, this.getOptions());
  }

  deleteBudget(category: string, month?: string) {
    const url = month ? `${this.baseUrl}/budgets/${category}?month=${month}` : `${this.baseUrl}/budgets/${category}`;
    return this.http.delete(url, this.getOptions());
  }

  updateProfile(data: any) {
    return this.http.put(`${this.baseUrl}/auth/profile`, data, this.getOptions());
  }

  changePassword(data: { currentPassword: string; newPassword: string }) {
    return this.http.put(`${this.baseUrl}/auth/password`, data, this.getOptions());
  }

  // Category endpoints
  getCategories() {
    return this.http.get(`${this.baseUrl}/categories`, this.getOptions());
  }

  getCategoriesByType(type: 'expense' | 'income') {
    return this.http.get(`${this.baseUrl}/categories/type/${type}`, this.getOptions());
  }

  createCategory(data: { name: string; type: 'expense' | 'income'; color?: string; icon?: string }) {
    return this.http.post(`${this.baseUrl}/categories`, data, this.getOptions());
  }

  updateCategory(categoryId: string, data: { name?: string; color?: string; icon?: string }) {
    return this.http.put(`${this.baseUrl}/categories/${categoryId}`, data, this.getOptions());
  }

  deleteCategory(categoryId: string) {
    return this.http.delete(`${this.baseUrl}/categories/${categoryId}`, this.getOptions());
  }

  initializeDefaultCategories() {
    return this.http.post(`${this.baseUrl}/categories/initialize-default`, {}, this.getOptions());
  }
}