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
}