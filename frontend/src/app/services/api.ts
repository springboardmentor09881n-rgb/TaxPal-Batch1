import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  login(data: any) {
    return this.http.post(
      `${this.baseUrl}/auth/login`,
      data,
      { withCredentials: true }
    );
  }

  register(data: any) {
    return this.http.post(
      `${this.baseUrl}/auth/register`,
      data,
      { withCredentials: true }
    );
  }

  getTransactions() {
    return this.http.get(
      `${this.baseUrl}/transactions`,
      { withCredentials: true }
    );
  }

  createTransaction(data: any) {
    return this.http.post(
      `${this.baseUrl}/transactions`,
      data,
      { withCredentials: true }
    );
  }
}