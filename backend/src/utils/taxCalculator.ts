/**
 * Utility for Modular Tax Estimation logic and quarterly due date calculation
 */

export interface ITaxCalculationInput {
  country: string;
  quarter: string;
  grossIncomeForQuarter: number;
  businessExpenses?: number;
  retirementContribution?: number;
  healthInsurancePremiums?: number;
  homeOfficeDeduction?: number;
  year?: number;
}

export interface ITaxCalculationResult {
  taxableIncome: number;
  annualTaxableIncome: number;
  annualEstimatedTax: number;
  estimatedTax: number;
  dueDate: Date;
}

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
export const calculateUSAAnnualTax = (annualTaxableIncome: number): number => {
  if (annualTaxableIncome <= 0) return 0;

  let tax = 0;
  if (annualTaxableIncome <= 11000) {
    tax = annualTaxableIncome * 0.10;
  } else if (annualTaxableIncome <= 44600) {
    tax = 11000 * 0.10 + (annualTaxableIncome - 11000) * 0.12;
  } else {
    tax = 11000 * 0.10 + (44600 - 11000) * 0.12 + (annualTaxableIncome - 44600) * 0.22;
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
  } else if (annualTaxableIncome <= 50270) {
    tax = (annualTaxableIncome - 12570) * 0.20;
  } else {
    tax = (50270 - 12570) * 0.20 + (annualTaxableIncome - 50270) * 0.40;
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
export const countryAnnualTaxCalculators: Record<string, (annualTaxableIncome: number) => number> = {
  india: calculateIndiaAnnualTax,
  in: calculateIndiaAnnualTax,
  usa: calculateUSAAnnualTax,
  us: calculateUSAAnnualTax,
  'united states': calculateUSAAnnualTax,
  uk: calculateUKAnnualTax,
  'united kingdom': calculateUKAnnualTax,
};

/**
 * Calculates Annual Estimated Tax based on country
 */
export const calculateAnnualEstimatedTax = (country: string, annualTaxableIncome: number): number => {
  const normalizedCountry = (country || '').trim().toLowerCase();
  const calculator = countryAnnualTaxCalculators[normalizedCountry] || calculateDefaultAnnualTax;
  return calculator(annualTaxableIncome);
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
 * 1. Annual Income = Gross Income For Quarter * 4
 * 2. Annual Taxable Income = Annual Income - Annual Deductions
 * 3. Apply Indian/Country Income Tax Slabs (Progressive Calculation)
 * 4. Calculate Annual Estimated Tax
 * 5. Quarterly Estimated Tax = Annual Estimated Tax / 4
 * 6. Generates Due Date based on quarter
 */
export const computeTaxEstimate = (input: ITaxCalculationInput): ITaxCalculationResult => {
  const { quarterlyTaxableIncome, annualTaxableIncome } = calculateTaxableIncome(input);
  const annualEstimatedTax = calculateAnnualEstimatedTax(input.country, annualTaxableIncome);
  
  // Step 5: Quarterly Estimated Tax = Annual Estimated Tax ÷ 4
  const estimatedTax = Number((annualEstimatedTax / 4).toFixed(2));
  const dueDate = calculateDueDate(input.quarter, input.year);

  return {
    taxableIncome: quarterlyTaxableIncome,
    annualTaxableIncome,
    annualEstimatedTax,
    estimatedTax,
    dueDate,
  };
};
