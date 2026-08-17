import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api';

@Component({
  selector: 'app-tax-estimator',
  imports: [RouterLink, CommonModule, ReactiveFormsModule],
  templateUrl: './tax-estimator.html',
  styleUrl: './tax-estimator.css'
})
export class TaxEstimator implements OnInit {
  taxForm!: FormGroup;
  userName = 'Freelancer';
  isLightTheme = false;
  isCalculated = false;

  // Calculation results
  grossIncome = 0;
  totalDeductions = 0;
  taxableIncome = 0;
  estimatedTax = 0;
  effectiveTaxRate = 0;
  appliedTaxRate = 0;

  // Selection list data
  countries = ['United States', 'India', 'Canada'];
  
  // All states mapping
  statesMap: { [key: string]: string[] } = {
    'United States': ['California', 'Texas'],
    'India': ['Karnataka', 'Maharashtra'],
    'Canada': ['Ontario', 'Quebec', 'British Columbia']
  };

  states: string[] = [];

  filingStatuses = ['Single', 'Married', 'Head of Household'];
  quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit() {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      this.isLightTheme = true;
      document.body.classList.add('light-theme');
    } else {
      this.isLightTheme = false;
      document.body.classList.remove('light-theme');
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.userName = user.fullName || 'Freelancer';
      } catch (e) {
        console.error('Error parsing user storage:', e);
      }
    }

    // Populate initial states list based on country selection
    this.updateStatesList(this.taxForm.get('country')?.value);

    // Watch for country change to update states
    this.taxForm.get('country')?.valueChanges.subscribe(country => {
      this.updateStatesList(country);
    });
  }

  private initForm() {
    this.taxForm = this.fb.group({
      country: ['United States', Validators.required],
      state: ['California', Validators.required],
      filingStatus: ['Single', Validators.required],
      quarter: ['Q1', Validators.required],
      grossIncome: [null, [Validators.required, Validators.min(0)]],
      businessExpenses: [0, [Validators.required, Validators.min(0)]],
      retirementContributions: [0, [Validators.required, Validators.min(0)]],
      healthInsurance: [0, [Validators.required, Validators.min(0)]],
      homeOfficeDeduction: [0, [Validators.required, Validators.min(0)]]
    });
  }

  private updateStatesList(country: string) {
    this.states = this.statesMap[country] || [];
    if (this.states.length > 0) {
      // Auto select the first state for the selected country
      this.taxForm.patchValue({ state: this.states[0] });
    } else {
      this.taxForm.patchValue({ state: '' });
    }
  }

  // Prevent invalid characters for number inputs on keyboard level
  preventInvalidNumberChars(event: KeyboardEvent) {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End', '.'];
    if (allowedKeys.includes(event.key)) {
      return;
    }
    // Block anything that is not a number
    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  // Clean value on input event (e.g. if they paste or type something else)
  cleanInput(controlName: string) {
    const control = this.taxForm.get(controlName);
    if (control && control.value !== null && control.value !== undefined) {
      let valStr = control.value.toString();
      // Remove any character except digits and decimal point
      valStr = valStr.replace(/[^0-9.]/g, '');
      
      // Ensure only one decimal point
      const dots = valStr.split('.');
      if (dots.length > 2) {
        valStr = dots[0] + '.' + dots.slice(1).join('');
      }

      if (valStr === '') {
        control.setValue(null, { emitEvent: false });
      } else {
        const parsed = parseFloat(valStr);
        if (control.value !== parsed) {
          control.setValue(parsed, { emitEvent: false });
        }
      }
    }
  }

  getCurrencySymbol(): string {
    const country = this.taxForm.get('country')?.value;
    if (country === 'India') return '₹';
    if (country === 'Canada') return 'CA$';
    return '$';
  }

  // Configuration of tax rates based on country/state/filingStatus
  getTaxRate(): number {
    const country = this.taxForm.get('country')?.value;
    const state = this.taxForm.get('state')?.value;
    const filingStatus = this.taxForm.get('filingStatus')?.value;

    if (country === 'United States') {
      if (state === 'California') {
        if (filingStatus === 'Single') return 0.28;
        if (filingStatus === 'Married') return 0.22;
        return 0.24; // Head of Household
      } else { // Texas (No state income tax, lower rate)
        if (filingStatus === 'Single') return 0.15;
        if (filingStatus === 'Married') return 0.12;
        return 0.13;
      }
    } else if (country === 'India') {
      // standard brackets in India
      return 0.20; // 20% flat rate for freelancer estimates
    } else if (country === 'Canada') {
      // standard Canadian rates
      if (filingStatus === 'Single') return 0.22;
      if (filingStatus === 'Married') return 0.18;
      return 0.20;
    }
    return 0.20; // default standard estimate rate
  }

  calculateTax() {
    if (this.taxForm.invalid) {
      this.taxForm.markAllAsTouched();
      return;
    }

    const formValues = this.taxForm.value;
    this.grossIncome = Number(formValues.grossIncome) || 0;
    
    this.totalDeductions = 
      (Number(formValues.businessExpenses) || 0) +
      (Number(formValues.retirementContributions) || 0) +
      (Number(formValues.healthInsurance) || 0) +
      (Number(formValues.homeOfficeDeduction) || 0);

    // Taxable Income = Gross Income - Total Deductions
    this.taxableIncome = Math.max(0, this.grossIncome - this.totalDeductions);

    // Estimated Tax = Taxable Income * Selected Tax Rate
    this.appliedTaxRate = this.getTaxRate();
    this.estimatedTax = this.taxableIncome * this.appliedTaxRate;

    // Effective Tax Rate = (Estimated Tax / Gross Income) * 100
    this.effectiveTaxRate = this.grossIncome > 0 ? (this.estimatedTax / this.grossIncome) * 100 : 0;

    this.isCalculated = true;
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

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    this.router.navigate(['/']);
  }
}
