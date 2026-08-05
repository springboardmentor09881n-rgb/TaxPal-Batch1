/**
 * Utility for Modular Tax Estimation logic and quarterly due date calculation
 */

export interface ITaxCalculationInput {
  country: string;
  quarter?: string;
  grossIncomeForQuarter: number;
  businessExpenses?: number;
  retirementContribution?: number;
  healthInsurancePremiums?: number;
  homeOfficeDeduction?: number;
  year?: number;
  filingStatus?: string;
  state?: string;
}

export interface ITaxCalculationResult {
  quarter: string;
  taxableIncome: number;
  annualTaxableIncome: number;
  annualEstimatedTax: number;
  estimatedTax: number;
  dueDate: Date;
}

/**
 * Auto-detects the current financial quarter based on the current date:
 * - Apr to Jun  → Q1
 * - Jul to Sep  → Q2
 * - Oct to Dec  → Q3
 * - Jan to Mar  → Q4
 */
export const getCurrentQuarter = (date: Date = new Date()): string => {
  const month = date.getUTCMonth() + 1; // 1 to 12
  if (month >= 4 && month <= 6) return 'Q1';
  if (month >= 7 && month <= 9) return 'Q2';
  if (month >= 10 && month <= 12) return 'Q3';
  return 'Q4';
};

/**
 * Step 1, 2 & 3: Calculate Quarterly & Annual Taxable Income
 * 
 * 1. Annual Income = grossIncomeForQuarter * 4
 * 2. Annual Deductions:
 *    - Annual Business Expenses = businessExpenses * 4
 *    - Annual Retirement Contribution = retirementContribution * 4
 *    - Annual Health Insurance Premium = healthInsurancePremiums * 4
 *    - Annual Home Office Deduction = homeOfficeDeduction * 4
 * 3. Annual Taxable Income = Annual Income - Annual Deductions
 */
export const calculateTaxableIncome = (input: {
  grossIncomeForQuarter: number;
  businessExpenses?: number;
  retirementContribution?: number;
  healthInsurancePremiums?: number;
  homeOfficeDeduction?: number;
}): { quarterlyTaxableIncome: number; annualTaxableIncome: number } => {
  const gross = input.grossIncomeForQuarter || 0;
  const business = input.businessExpenses || 0;
  const retirement = input.retirementContribution || 0;
  const health = input.healthInsurancePremiums || 0;
  const homeOffice = input.homeOfficeDeduction || 0;

  const quarterlyDeductions = business + retirement + health + homeOffice;
  const quarterlyTaxableIncome = Math.max(0, gross - quarterlyDeductions);

  const annualGross = gross * 4;
  const annualDeductions = quarterlyDeductions * 4;
  const annualTaxableIncome = Math.max(0, annualGross - annualDeductions);

  return {
    quarterlyTaxableIncome,
    annualTaxableIncome,
  };
};

/**
 * Step 4: Calculate Annual Estimated Tax using Indian Income Tax Progressive Slabs (New Tax Regime)
 * 
 * Slabs:
 * - ₹0 – ₹4,00,000          → 0%
 * - ₹4,00,001 – ₹8,00,000   → 5%  (span: ₹400,000)
 * - ₹8,00,001 – ₹12,00,000  → 10% (span: ₹400,000)
 * - ₹12,00,001 – ₹16,00,000 → 15% (span: ₹400,000)
 * - ₹16,00,001 – ₹20,00,000 → 20% (span: ₹400,000)
 * - ₹20,00,001 – ₹24,00,000 → 25% (span: ₹400,000)
 * - Above ₹24,00,000        → 30%
 */
export const calculateIndiaAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  // Slab 1: ₹0 – ₹4,00,000 (0%)
  if (annualTaxableIncome <= 400000) {
    return 0;
  }

  // Slab 2: ₹4,00,001 – ₹8,00,000 (5%)
  if (annualTaxableIncome > 400000) {
    const taxableInSlab = Math.min(annualTaxableIncome - 400000, 400000);
    tax += taxableInSlab * 0.05;
  }

  // Slab 3: ₹8,00,001 – ₹12,00,000 (10%)
  if (annualTaxableIncome > 800000) {
    const taxableInSlab = Math.min(annualTaxableIncome - 800000, 400000);
    tax += taxableInSlab * 0.10;
  }

  // Slab 4: ₹12,00,001 – ₹16,00,000 (15%)
  if (annualTaxableIncome > 1200000) {
    const taxableInSlab = Math.min(annualTaxableIncome - 1200000, 400000);
    tax += taxableInSlab * 0.15;
  }

  // Slab 5: ₹16,00,001 – ₹20,00,000 (20%)
  if (annualTaxableIncome > 1600000) {
    const taxableInSlab = Math.min(annualTaxableIncome - 1600000, 400000);
    tax += taxableInSlab * 0.20;
  }

  // Slab 6: ₹20,00,001 – ₹24,00,000 (25%)
  if (annualTaxableIncome > 2000000) {
    const taxableInSlab = Math.min(annualTaxableIncome - 2000000, 400000);
    tax += taxableInSlab * 0.25;
  }

  // Slab 7: Above ₹24,00,000 (30%)
  if (annualTaxableIncome > 2400000) {
    const taxableInSlab = annualTaxableIncome - 2400000;
    tax += taxableInSlab * 0.30;
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for USA
 */
const calculateUSAStateTax = (income: number, state?: string): number => {
  const normState = (state || '').trim().toLowerCase();
  if (normState === 'california') {
    const limits = [0, 10000, 25000, 40000, 55000, 70000, 350000, 420000, 700000, Infinity];
    const rates = [1, 2, 4, 6, 8, 9.3, 10.3, 11.3, 13.3];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  if (normState === 'new york') {
    const limits = [0, 12000, 25000, 80000, 215000, 1000000, 5000000, Infinity];
    const rates = [4, 4.5, 5.85, 6.25, 6.85, 9.65, 10.9];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  if (normState === 'illinois') {
    return income * 0.0495;
  }
  if (normState === 'pennsylvania') {
    return income * 0.0307;
  }
  if (normState === 'ohio') {
    const limits = [0, 26050, 46100, 100000, Infinity];
    const rates = [0, 1.38, 2.25, 2.75];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  if (normState === 'georgia') {
    return income * 0.0519;
  }
  if (normState === 'north carolina') {
    return income * 0.0399;
  }
  if (normState === 'new jersey') {
    const limits = [0, 20000, 35000, 40000, 75000, 500000, 1000000, Infinity];
    const rates = [1.4, 1.75, 3.5, 5.525, 6.37, 8.97, 10.75];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  return 0;
};

export const calculateUSAAnnualTax = (annualTaxableIncome: number, filingStatus?: string, state?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  const status = (filingStatus || '').trim().toLowerCase();
  let rateKey = 'single';
  if (status.includes('joint') || status === 'married') {
    rateKey = 'mfj';
  } else if (status.includes('separat')) {
    rateKey = 'mfs';
  } else if (status.includes('head') || status.includes('hoh')) {
    rateKey = 'hoh';
  }

  const USA_LIMITS = [0, 12400, 24800, 50400, 100800, 105700, 201775, 211400, 256225, 403550, 512450, 640600, 768700, Infinity];

  const USA_RATES: Record<string, number[]> = {
    single: [10, 12, 12, 22, 22, 24, 32, 32, 35, 35, 37, 37, 37],
    mfj: [10, 10, 12, 22, 22, 22, 24, 24, 32, 35, 35, 37, 37],
    mfs: [10, 12, 12, 22, 22, 24, 32, 32, 35, 37, 37, 37, 37],
    hoh: [10, 10, 12, 12, 22, 22, 24, 24, 32, 35, 35, 37, 37]
  };

  const rates = USA_RATES[rateKey];
  let tax = 0;
  for (let i = 0; i < rates.length; i++) {
    const from = USA_LIMITS[i];
    const to = USA_LIMITS[i + 1];
    const rate = rates[i];
    if (annualTaxableIncome > from) {
      const taxable = Math.min(annualTaxableIncome, to) - from;
      tax += taxable * (rate / 100);
    }
  }

  const federalTax = Number(tax.toFixed(2));
  const stateTax = calculateUSAStateTax(annualTaxableIncome, state);
  return Number((federalTax + stateTax).toFixed(2));
};

/**
 * Annual Progressive tax calculator for UK
 */
export const calculateUKAnnualTax = (annualTaxableIncome: number, filingStatus?: string, state?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  const isScotland = (state || '').trim().toLowerCase().includes('scotland');

  let tax = 0;
  if (isScotland) {
    const limits = [0, 12570, 16537, 29526, 43662, 75000, 125140, Infinity];
    const rates = [0, 19, 20, 21, 42, 45, 48];
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (annualTaxableIncome > from) {
        const taxable = Math.min(annualTaxableIncome, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
  } else {
    const limits = [0, 12570, 50270, 125140, Infinity];
    const rates = [0, 20, 40, 45];
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      const rate = rates[i];
      if (annualTaxableIncome > from) {
        const taxable = Math.min(annualTaxableIncome, to) - from;
        tax += taxable * (rate / 100);
      }
    }
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for China
 */
export const calculateChinaAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 36000) {
    tax = annualTaxableIncome * 0.03;
  } else if (annualTaxableIncome <= 144000) {
    tax = 36000 * 0.03 + (annualTaxableIncome - 36000) * 0.10;
  } else if (annualTaxableIncome <= 300000) {
    tax = 36000 * 0.03 + (144000 - 36000) * 0.10 + (annualTaxableIncome - 144000) * 0.20;
  } else if (annualTaxableIncome <= 420000) {
    tax =
      36000 * 0.03 +
      (144000 - 36000) * 0.10 +
      (300000 - 144000) * 0.20 +
      (annualTaxableIncome - 300000) * 0.25;
  } else if (annualTaxableIncome <= 660000) {
    tax =
      36000 * 0.03 +
      (144000 - 36000) * 0.10 +
      (300000 - 144000) * 0.20 +
      (420000 - 300000) * 0.25 +
      (annualTaxableIncome - 420000) * 0.30;
  } else if (annualTaxableIncome <= 960000) {
    tax =
      36000 * 0.03 +
      (144000 - 36000) * 0.10 +
      (300000 - 144000) * 0.20 +
      (420000 - 300000) * 0.25 +
      (660000 - 420000) * 0.30 +
      (annualTaxableIncome - 660000) * 0.35;
  } else {
    tax =
      36000 * 0.03 +
      (144000 - 36000) * 0.10 +
      (300000 - 144000) * 0.20 +
      (420000 - 300000) * 0.25 +
      (660000 - 420000) * 0.30 +
      (960000 - 660000) * 0.35 +
      (annualTaxableIncome - 960000) * 0.45;
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for Germany
 */
const calculateGermanySingleTax = (income: number): number => {
  if (income <= 12348) return 0;
  if (income <= 68480) {
    const diff = income - 12348;
    return diff * 0.14 + (diff * diff * 0.14) / 56132;
  }
  if (income <= 277825) {
    return 15716.96 + (income - 68480) * 0.42;
  }
  return 103641.86 + (income - 277825) * 0.45;
};

export const calculateGermanyAnnualTax = (annualTaxableIncome: number, filingStatus?: string, state?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  const status = (filingStatus || '').trim().toLowerCase();
  let tax = 0;

  if (status.includes('joint') || status === 'married') {
    const halfIncome = annualTaxableIncome / 2;
    tax = calculateGermanySingleTax(halfIncome) * 2;
  } else {
    tax = calculateGermanySingleTax(annualTaxableIncome);
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for Japan
 */
export const calculateJapanAnnualTax = (annualTaxableIncome: number, filingStatus?: string, state?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 1950000) {
    tax = annualTaxableIncome * 0.05;
  } else if (annualTaxableIncome <= 3300000) {
    tax = 1950000 * 0.05 + (annualTaxableIncome - 1950000) * 0.10;
  } else if (annualTaxableIncome <= 6950000) {
    tax = 1950000 * 0.05 + (3300000 - 1950000) * 0.10 + (annualTaxableIncome - 3300000) * 0.20;
  } else if (annualTaxableIncome <= 9000000) {
    tax =
      1950000 * 0.05 +
      (3300000 - 1950000) * 0.10 +
      (6950000 - 3300000) * 0.20 +
      (annualTaxableIncome - 6950000) * 0.23;
  } else if (annualTaxableIncome <= 18000000) {
    tax =
      1950000 * 0.05 +
      (3300000 - 1950000) * 0.10 +
      (6950000 - 3300000) * 0.20 +
      (9000000 - 6950000) * 0.23 +
      (annualTaxableIncome - 9000000) * 0.33;
  } else if (annualTaxableIncome <= 40000000) {
    tax =
      1950000 * 0.05 +
      (3300000 - 1950000) * 0.10 +
      (6950000 - 3300000) * 0.20 +
      (9000000 - 6950000) * 0.23 +
      (18000000 - 9000000) * 0.33 +
      (annualTaxableIncome - 18000000) * 0.40;
  } else {
    tax =
      1950000 * 0.05 +
      (3300000 - 1950000) * 0.10 +
      (6950000 - 3300000) * 0.20 +
      (9000000 - 6950000) * 0.23 +
      (18000000 - 9000000) * 0.33 +
      (40000000 - 18000000) * 0.40 +
      (annualTaxableIncome - 40000000) * 0.45;
  }

  const federalTax = Number(tax.toFixed(2));
  const normState = (state || '').trim().toLowerCase();
  let localTax = 0;
  if (normState === 'tokyo' || normState === 'osaka' || normState === 'kyoto') {
    localTax = annualTaxableIncome * 0.10;
  }

  return Number((federalTax + localTax).toFixed(2));
};

const calculateCanadaProvincialTax = (income: number, province?: string): number => {
  const normProv = (province || '').trim().toLowerCase();
  if (normProv === 'ontario') {
    const limits = [0, 50000, 100000, Infinity];
    const rates = [5.05, 9.15, 11.16];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  if (normProv === 'quebec') {
    const limits = [0, 50000, 100000, Infinity];
    const rates = [14, 19, 24];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  if (normProv === 'british columbia') {
    const limits = [0, 50000, 100000, Infinity];
    const rates = [5.06, 7.7, 10.5];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  if (normProv === 'alberta') {
    const limits = [0, 150000, Infinity];
    const rates = [10, 12];
    let tax = 0;
    for (let i = 0; i < rates.length; i++) {
      const from = limits[i];
      const to = limits[i + 1];
      if (income > from) {
        const taxable = Math.min(income, to) - from;
        tax += taxable * (rates[i] / 100);
      }
    }
    return tax;
  }
  return 0;
};

/**
 * Annual Progressive tax calculator for Canada
 */
export const calculateCanadaAnnualTax = (annualTaxableIncome: number, filingStatus?: string, state?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 58523) {
    tax = annualTaxableIncome * 0.14;
  } else if (annualTaxableIncome <= 117045) {
    tax = 58523 * 0.14 + (annualTaxableIncome - 58523) * 0.205;
  } else if (annualTaxableIncome <= 181440) {
    tax = 58523 * 0.14 + (117045 - 58523) * 0.205 + (annualTaxableIncome - 117045) * 0.26;
  } else if (annualTaxableIncome <= 258482) {
    tax =
      58523 * 0.14 +
      (117045 - 58523) * 0.205 +
      (181440 - 117045) * 0.26 +
      (annualTaxableIncome - 181440) * 0.29;
  } else {
    tax =
      58523 * 0.14 +
      (117045 - 58523) * 0.205 +
      (181440 - 117045) * 0.26 +
      (258482 - 181440) * 0.29 +
      (annualTaxableIncome - 258482) * 0.33;
  }

  const federalTax = Number(tax.toFixed(2));
  const provincialTax = calculateCanadaProvincialTax(annualTaxableIncome, state);
  return Number((federalTax + provincialTax).toFixed(2));
};

/**
 * Annual Progressive tax calculator for Australia
 */
export const calculateAustraliaAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 18200) {
    tax = 0;
  } else if (annualTaxableIncome <= 45000) {
    tax = (annualTaxableIncome - 18200) * 0.16;
  } else if (annualTaxableIncome <= 135000) {
    tax = 4288 + (annualTaxableIncome - 45000) * 0.30;
  } else if (annualTaxableIncome <= 190000) {
    tax = 31288 + (annualTaxableIncome - 135000) * 0.37;
  } else {
    tax = 51638 + (annualTaxableIncome - 190000) * 0.45;
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for France
 */
const calculateFranceSingleTax = (income: number): number => {
  const FRANCE_LIMITS = [0, 11497, 29315, 83823, 180294, Infinity];
  const FRANCE_RATES = [0, 11, 30, 41, 45];

  let tax = 0;
  for (let i = 0; i < FRANCE_RATES.length; i++) {
    const from = FRANCE_LIMITS[i];
    const to = FRANCE_LIMITS[i + 1];
    const rate = FRANCE_RATES[i];
    if (income > from) {
      const taxable = Math.min(income, to) - from;
      tax += taxable * (rate / 100);
    }
  }
  return tax;
};

export const calculateFranceAnnualTax = (annualTaxableIncome: number, filingStatus?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  const status = (filingStatus || '').trim().toLowerCase();
  let tax = 0;

  if (status.includes('joint') || status === 'married') {
    const halfIncome = annualTaxableIncome / 2;
    tax = calculateFranceSingleTax(halfIncome) * 2;
  } else {
    tax = calculateFranceSingleTax(annualTaxableIncome);
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for Singapore
 */
export const calculateSingaporeAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 20000) {
    tax = 0;
  } else if (annualTaxableIncome <= 30000) {
    tax = (annualTaxableIncome - 20000) * 0.02;
  } else if (annualTaxableIncome <= 40000) {
    tax = 200 + (annualTaxableIncome - 30000) * 0.035;
  } else if (annualTaxableIncome <= 80000) {
    tax = 550 + (annualTaxableIncome - 40000) * 0.07;
  } else if (annualTaxableIncome <= 120000) {
    tax = 3350 + (annualTaxableIncome - 80000) * 0.115;
  } else if (annualTaxableIncome <= 160000) {
    tax = 7950 + (annualTaxableIncome - 120000) * 0.15;
  } else if (annualTaxableIncome <= 200000) {
    tax = 13950 + (annualTaxableIncome - 160000) * 0.18;
  } else if (annualTaxableIncome <= 240000) {
    tax = 21150 + (annualTaxableIncome - 200000) * 0.19;
  } else if (annualTaxableIncome <= 280000) {
    tax = 28750 + (annualTaxableIncome - 240000) * 0.195;
  } else if (annualTaxableIncome <= 320000) {
    tax = 36550 + (annualTaxableIncome - 280000) * 0.20;
  } else if (annualTaxableIncome <= 500000) {
    tax = 44550 + (annualTaxableIncome - 320000) * 0.22;
  } else if (annualTaxableIncome <= 1000000) {
    tax = 84150 + (annualTaxableIncome - 500000) * 0.23;
  } else {
    tax = 199150 + (annualTaxableIncome - 1000000) * 0.24;
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for Switzerland
 */
const calculateSwitzerlandCantonalTax = (income: number, canton?: string): number => {
  const normCanton = (canton || '').trim().toLowerCase();
  if (normCanton === 'zurich') {
    return income * 0.085;
  }
  if (normCanton === 'geneva') {
    return income * 0.19;
  }
  if (normCanton === 'vaud') {
    return income * 0.15;
  }
  if (normCanton === 'bern') {
    return income * 0.12;
  }
  return 0;
};

export const calculateSwitzerlandAnnualTax = (annualTaxableIncome: number, filingStatus?: string, state?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  const status = (filingStatus || '').trim().toLowerCase();
  let tax = 0;

  if (status.includes('joint') || status === 'married') {
    if (annualTaxableIncome > 895800) {
      tax = annualTaxableIncome * 0.115;
    } else {
      const limits = [0, 28300, 50900, 58400, 75300, 90300, 103400, 114700, 124200, 131800, 137500, 141200, 143100, 145000, 895800];
      const rates = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 13];
      for (let i = 0; i < rates.length; i++) {
        const from = limits[i];
        const to = limits[i + 1];
        const rate = rates[i];
        if (annualTaxableIncome > from) {
          const taxable = Math.min(annualTaxableIncome, to) - from;
          tax += taxable * (rate / 100);
        }
      }
    }
  } else {
    if (annualTaxableIncome > 783200) {
      tax = annualTaxableIncome * 0.115;
    } else {
      const limits = [0, 18300, 32000, 42000, 56000, 74000, 105000, 140000, 180000, 783200];
      const rates = [0, 0.77, 0.88, 2.64, 2.97, 6.6, 8.8, 11, 13.2];
      for (let i = 0; i < rates.length; i++) {
        const from = limits[i];
        const to = limits[i + 1];
        const rate = rates[i];
        if (annualTaxableIncome > from) {
          const taxable = Math.min(annualTaxableIncome, to) - from;
          tax += taxable * (rate / 100);
        }
      }
    }
  }

  const federalTax = Number(tax.toFixed(2));
  const cantonalTax = calculateSwitzerlandCantonalTax(annualTaxableIncome, state);
  return Number((federalTax + cantonalTax).toFixed(2));
};

/**
 * Default fallback tax calculator (10% flat rate)
 */
export const calculateDefaultAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;
  return Number((annualTaxableIncome * 0.10).toFixed(2));
};

/**
 * Modular Country Tax Calculator Registry
 */
export const countryAnnualTaxCalculators: Record<
  string,
  (annualTaxableIncome: number, filingStatus?: string, state?: string) => number
> = {
  india: calculateIndiaAnnualTax,
  in: calculateIndiaAnnualTax,
  usa: calculateUSAAnnualTax,
  us: calculateUSAAnnualTax,
  'united states': calculateUSAAnnualTax,
  uk: calculateUKAnnualTax,
  'united kingdom': calculateUKAnnualTax,
  china: calculateChinaAnnualTax,
  cn: calculateChinaAnnualTax,
  germany: calculateGermanyAnnualTax,
  de: calculateGermanyAnnualTax,
  japan: calculateJapanAnnualTax,
  jp: calculateJapanAnnualTax,
  canada: calculateCanadaAnnualTax,
  ca: calculateCanadaAnnualTax,
  australia: calculateAustraliaAnnualTax,
  au: calculateAustraliaAnnualTax,
  france: calculateFranceAnnualTax,
  fr: calculateFranceAnnualTax,
  singapore: calculateSingaporeAnnualTax,
  sg: calculateSingaporeAnnualTax,
  switzerland: calculateSwitzerlandAnnualTax,
  ch: calculateSwitzerlandAnnualTax,
};

/**
 * Calculates Annual Estimated Tax based on country
 */
export const calculateAnnualEstimatedTax = (country: string, annualTaxableIncome: number, filingStatus?: string, state?: string): number => {
  const normalizedCountry = (country || '').trim().toLowerCase();
  const calculator = countryAnnualTaxCalculators[normalizedCountry] || calculateDefaultAnnualTax;
  return calculator(annualTaxableIncome, filingStatus, state);
};

/**
 * Step 6: Automatically generate Due Date based on selected quarter
 * - Q1 → 15 June
 * - Q2 → 15 September
 * - Q3 → 15 December
 * - Q4 → 15 March (Next Year)
 */
export const calculateDueDate = (quarter: string, year?: number): Date => {
  const currentYear = year || new Date().getFullYear();
  const normalizedQuarter = (quarter || '').trim().toUpperCase();

  switch (normalizedQuarter) {
    case 'Q1':
      // 15 June (Month index 5 in UTC)
      return new Date(Date.UTC(currentYear, 5, 15));
    case 'Q2':
      // 15 September (Month index 8 in UTC)
      return new Date(Date.UTC(currentYear, 8, 15));
    case 'Q3':
      // 15 December (Month index 11 in UTC)
      return new Date(Date.UTC(currentYear, 11, 15));
    case 'Q4':
      // 15 March Next Year (Month index 2 in UTC)
      return new Date(Date.UTC(currentYear + 1, 2, 15));
    default:
      return new Date(Date.UTC(currentYear, 5, 15));
  }
};

/**
 * Master utility function executing all steps:
 * 1. Auto-detects quarter if not provided
 * 2. Annual Income = Gross Income For Quarter * 4
 * 3. Annual Taxable Income = Annual Income - Annual Deductions
 * 4. Apply Indian/Country Income Tax Slabs (Progressive Calculation)
 * 5. Calculate Annual Estimated Tax
 * 6. Quarterly Estimated Tax = Annual Estimated Tax / 4
 * 7. Generates Due Date based on quarter
 */
export const computeTaxEstimate = (input: ITaxCalculationInput): ITaxCalculationResult => {
  const quarter = input.quarter || getCurrentQuarter();
  const { quarterlyTaxableIncome, annualTaxableIncome } = calculateTaxableIncome(input);
  const annualEstimatedTax = calculateAnnualEstimatedTax(input.country, annualTaxableIncome, input.filingStatus, input.state);

  // Step 5: Quarterly Estimated Tax = Annual Estimated Tax ÷ 4
  const estimatedTax = Number((annualEstimatedTax / 4).toFixed(2));
  const dueDate = calculateDueDate(quarter, input.year);

  return {
    quarter,
    taxableIncome: quarterlyTaxableIncome,
    annualTaxableIncome,
    annualEstimatedTax,
    estimatedTax,
    dueDate,
  };
};
