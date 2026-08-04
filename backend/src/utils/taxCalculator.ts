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
export const calculateUSAAnnualTax = (annualTaxableIncome: number, filingStatus?: string): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;
  const status = (filingStatus || '').trim().toLowerCase();

  if (status === 'married filing jointly' || status === 'married') {
    if (annualTaxableIncome <= 24800) {
      tax = annualTaxableIncome * 0.10;
    } else if (annualTaxableIncome <= 100800) {
      tax = 24800 * 0.10 + (annualTaxableIncome - 24800) * 0.12;
    } else if (annualTaxableIncome <= 211400) {
      tax = 24800 * 0.10 + (100800 - 24800) * 0.12 + (annualTaxableIncome - 100800) * 0.22;
    } else if (annualTaxableIncome <= 403550) {
      tax = 24800 * 0.10 + (100800 - 24800) * 0.12 + (211400 - 100800) * 0.22 + (annualTaxableIncome - 211400) * 0.24;
    } else if (annualTaxableIncome <= 512450) {
      tax = 24800 * 0.10 + (100800 - 24800) * 0.12 + (211400 - 100800) * 0.22 + (403550 - 211400) * 0.24 + (annualTaxableIncome - 403550) * 0.32;
    } else if (annualTaxableIncome <= 768700) {
      tax = 24800 * 0.10 + (100800 - 24800) * 0.12 + (211400 - 100800) * 0.22 + (403550 - 211400) * 0.24 + (512450 - 403550) * 0.32 + (annualTaxableIncome - 512450) * 0.35;
    } else {
      tax = 24800 * 0.10 + (100800 - 24800) * 0.12 + (211400 - 100800) * 0.22 + (403550 - 211400) * 0.24 + (512450 - 403550) * 0.32 + (768700 - 512450) * 0.35 + (annualTaxableIncome - 768700) * 0.37;
    }
  } else if (status === 'head of household') {
    if (annualTaxableIncome <= 17700) {
      tax = annualTaxableIncome * 0.10;
    } else if (annualTaxableIncome <= 67450) {
      tax = 17700 * 0.10 + (annualTaxableIncome - 17700) * 0.12;
    } else if (annualTaxableIncome <= 105700) {
      tax = 17700 * 0.10 + (67450 - 17700) * 0.12 + (annualTaxableIncome - 67450) * 0.22;
    } else if (annualTaxableIncome <= 201775) {
      tax = 17700 * 0.10 + (67450 - 17700) * 0.12 + (105700 - 67450) * 0.22 + (annualTaxableIncome - 105700) * 0.24;
    } else if (annualTaxableIncome <= 256200) {
      tax = 17700 * 0.10 + (67450 - 17700) * 0.12 + (105700 - 67450) * 0.22 + (201775 - 105700) * 0.24 + (annualTaxableIncome - 201775) * 0.32;
    } else if (annualTaxableIncome <= 640600) {
      tax = 17700 * 0.10 + (67450 - 17700) * 0.12 + (105700 - 67450) * 0.22 + (201775 - 105700) * 0.24 + (256200 - 201775) * 0.32 + (annualTaxableIncome - 256200) * 0.35;
    } else {
      tax = 17700 * 0.10 + (67450 - 17700) * 0.12 + (105700 - 67450) * 0.22 + (201775 - 105700) * 0.24 + (256200 - 201775) * 0.32 + (640600 - 256200) * 0.35 + (annualTaxableIncome - 640600) * 0.37;
    }
  } else {
    if (annualTaxableIncome <= 12400) {
      tax = annualTaxableIncome * 0.10;
    } else if (annualTaxableIncome <= 50400) {
      tax = 12400 * 0.10 + (annualTaxableIncome - 12400) * 0.12;
    } else if (annualTaxableIncome <= 105700) {
      tax = 12400 * 0.10 + (50400 - 12400) * 0.12 + (annualTaxableIncome - 50400) * 0.22;
    } else if (annualTaxableIncome <= 201775) {
      tax = 12400 * 0.10 + (50400 - 12400) * 0.12 + (105700 - 50400) * 0.22 + (annualTaxableIncome - 105700) * 0.24;
    } else if (annualTaxableIncome <= 256225) {
      tax = 12400 * 0.10 + (50400 - 12400) * 0.12 + (105700 - 50400) * 0.22 + (201775 - 105700) * 0.24 + (annualTaxableIncome - 201775) * 0.32;
    } else if (annualTaxableIncome <= 640600) {
      tax = 12400 * 0.10 + (50400 - 12400) * 0.12 + (105700 - 50400) * 0.22 + (201775 - 105700) * 0.24 + (256225 - 201775) * 0.32 + (annualTaxableIncome - 256225) * 0.35;
    } else {
      tax = 12400 * 0.10 + (50400 - 12400) * 0.12 + (105700 - 50400) * 0.22 + (201775 - 105700) * 0.24 + (256225 - 201775) * 0.32 + (640600 - 256225) * 0.35 + (annualTaxableIncome - 640600) * 0.37;
    }
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for UK
 */
export const calculateUKAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 12570) {
    tax = 0;
  } else if (annualTaxableIncome <= 16537) {
    tax = (annualTaxableIncome - 12570) * 0.19;
  } else if (annualTaxableIncome <= 29526) {
    tax = (16537 - 12570) * 0.19 + (annualTaxableIncome - 16537) * 0.20;
  } else if (annualTaxableIncome <= 43662) {
    tax =
      (16537 - 12570) * 0.19 +
      (29526 - 16537) * 0.20 +
      (annualTaxableIncome - 29526) * 0.21;
  } else if (annualTaxableIncome <= 75000) {
    tax =
      (16537 - 12570) * 0.19 +
      (29526 - 16537) * 0.20 +
      (43662 - 29526) * 0.21 +
      (annualTaxableIncome - 43662) * 0.42;
  } else if (annualTaxableIncome <= 125140) {
    tax =
      (16537 - 12570) * 0.19 +
      (29526 - 16537) * 0.20 +
      (43662 - 29526) * 0.21 +
      (75000 - 43662) * 0.42 +
      (annualTaxableIncome - 75000) * 0.45;
  } else {
    tax =
      (16537 - 12570) * 0.19 +
      (29526 - 16537) * 0.20 +
      (43662 - 29526) * 0.21 +
      (75000 - 43662) * 0.42 +
      (125140 - 75000) * 0.45 +
      (annualTaxableIncome - 125140) * 0.48;
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
export const calculateGermanyAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 12348) {
    tax = 0;
  } else if (annualTaxableIncome <= 17799) {
    tax = (annualTaxableIncome - 12348) * 0.14;
  } else if (annualTaxableIncome <= 277825) {
    tax = (17799 - 12348) * 0.14 + (annualTaxableIncome - 17799) * 0.42;
  } else {
    tax = (17799 - 12348) * 0.14 + (277825 - 17799) * 0.42 + (annualTaxableIncome - 277825) * 0.45;
  }

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for Japan
 */
export const calculateJapanAnnualTax = (annualTaxableIncome: number): number => {
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

  return Number(tax.toFixed(2));
};

/**
 * Annual Progressive tax calculator for Canada
 */
export const calculateCanadaAnnualTax = (annualTaxableIncome: number): number => {
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

  return Number(tax.toFixed(2));
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
export const calculateFranceAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 11600) {
    tax = 0;
  } else if (annualTaxableIncome <= 29579) {
    tax = (annualTaxableIncome - 11600) * 0.11;
  } else if (annualTaxableIncome <= 84577) {
    tax = (29579 - 11600) * 0.11 + (annualTaxableIncome - 29579) * 0.30;
  } else if (annualTaxableIncome <= 181917) {
    tax = (29579 - 11600) * 0.11 + (84577 - 29579) * 0.30 + (annualTaxableIncome - 84577) * 0.41;
  } else {
    tax =
      (29579 - 11600) * 0.11 +
      (84577 - 29579) * 0.30 +
      (181917 - 84577) * 0.41 +
      (annualTaxableIncome - 181917) * 0.45;
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
export const calculateSwitzerlandAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;

  if (annualTaxableIncome <= 15200) {
    tax = 0;
  } else if (annualTaxableIncome <= 33200) {
    tax = (annualTaxableIncome - 15200) * 0.0077;
  } else if (annualTaxableIncome <= 43500) {
    tax = 138.60 + (annualTaxableIncome - 33200) * 0.0088;
  } else if (annualTaxableIncome <= 58000) {
    tax = 229.20 + (annualTaxableIncome - 43500) * 0.0264;
  } else if (annualTaxableIncome <= 76200) {
    tax = 612.00 + (annualTaxableIncome - 58000) * 0.0297;
  } else if (annualTaxableIncome <= 82100) {
    tax = 1152.50 + (annualTaxableIncome - 76200) * 0.066;
  } else if (annualTaxableIncome <= 108900) {
    tax = 1502.95 + (annualTaxableIncome - 82100) * 0.066;
  } else if (annualTaxableIncome <= 141500) {
    tax = 3271.75 + (annualTaxableIncome - 108900) * 0.088;
  } else if (annualTaxableIncome <= 185100) {
    tax = 6140.55 + (annualTaxableIncome - 141500) * 0.11;
  } else if (annualTaxableIncome <= 793900) {
    tax = 10936.55 + (annualTaxableIncome - 185100) * 0.132;
  } else {
    tax = 91298.15;
  }

  return Number(tax.toFixed(2));
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
  (annualTaxableIncome: number, filingStatus?: string) => number
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
export const calculateAnnualEstimatedTax = (country: string, annualTaxableIncome: number, filingStatus?: string): number => {
  const normalizedCountry = (country || '').trim().toLowerCase();
  const calculator = countryAnnualTaxCalculators[normalizedCountry] || calculateDefaultAnnualTax;
  return calculator(annualTaxableIncome, filingStatus);
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
  const annualEstimatedTax = calculateAnnualEstimatedTax(input.country, annualTaxableIncome, input.filingStatus);
  
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
