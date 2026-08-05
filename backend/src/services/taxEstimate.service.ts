import { TaxEstimate, ITaxEstimateDocument } from '../models/TaxEstimate';
import { ApiError } from '../utils/ApiError';
import { computeTaxEstimate } from '../utils/taxCalculator';
import { AlertService } from './alert.service';

export interface ICreateTaxEstimateDTO {
  country: string;
  state?: string;
  quarter?: string;
  year?: number;
  grossIncomeForQuarter: number;
  businessExpenses?: number;
  retirementContribution?: number;
  healthInsurancePremiums?: number;
  homeOfficeDeduction?: number;
  status?: string;
  filingStatus?: string;
}

export interface IUpdateTaxEstimateDTO {
  country?: string;
  state?: string;
  quarter?: string;
  year?: number;
  grossIncomeForQuarter?: number;
  businessExpenses?: number;
  retirementContribution?: number;
  healthInsurancePremiums?: number;
  homeOfficeDeduction?: number;
  status?: string;
  filingStatus?: string;
}

export class TaxEstimateService {
  /**
   * Creates a new tax estimate for the logged in user
   */
  public static async createTaxEstimate(
    userId: string,
    data: ICreateTaxEstimateDTO
  ): Promise<ITaxEstimateDocument> {
    const calculation = computeTaxEstimate({
      country: data.country,
      state: data.state,
      quarter: data.quarter,
      year: data.year,
      grossIncomeForQuarter: data.grossIncomeForQuarter,
      businessExpenses: data.businessExpenses,
      retirementContribution: data.retirementContribution,
      healthInsurancePremiums: data.healthInsurancePremiums,
      homeOfficeDeduction: data.homeOfficeDeduction,
      filingStatus: data.filingStatus,
    });

    const taxEstimate = new TaxEstimate({
      userId,
      country: data.country,
      state: data.state || '',
      quarter: calculation.quarter, // Uses auto-detected quarter if quarter was omitted
      grossIncomeForQuarter: data.grossIncomeForQuarter,
      businessExpenses: data.businessExpenses ?? 0,
      retirementContribution: data.retirementContribution ?? 0,
      healthInsurancePremiums: data.healthInsurancePremiums ?? 0,
      homeOfficeDeduction: data.homeOfficeDeduction ?? 0,
      estimatedTax: calculation.estimatedTax,
      dueDate: calculation.dueDate,
      status: data.status || 'Pending',
      filingStatus: data.filingStatus || 'Not Filed',
    });

    const savedEstimate = await taxEstimate.save();

    // Automatically generate quarterly tax reminder alert
    try {
      await AlertService.createTaxReminderAlert(userId, calculation.quarter, calculation.dueDate);
    } catch (alertError) {
      // Log alert creation error without failing tax estimate creation
      console.error('Failed to auto-generate tax reminder alert:', alertError);
    }

    return savedEstimate;
  }

  /**
   * Retrieves all tax estimates for the logged in user
   */
  public static async getTaxEstimates(userId: string): Promise<ITaxEstimateDocument[]> {
    return await TaxEstimate.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a single tax estimate by ID for the logged in user
   */
  public static async getTaxEstimateById(
    userId: string,
    estimateId: string
  ): Promise<ITaxEstimateDocument> {
    const taxEstimate = await TaxEstimate.findOne({ _id: estimateId, userId });
    if (!taxEstimate) {
      throw new ApiError(404, 'Tax estimate not found');
    }
    return taxEstimate;
  }

  /**
   * Updates an existing tax estimate for the logged in user
   */
  public static async updateTaxEstimate(
    userId: string,
    estimateId: string,
    data: IUpdateTaxEstimateDTO
  ): Promise<ITaxEstimateDocument> {
    const existingEstimate = await TaxEstimate.findOne({ _id: estimateId, userId });
    if (!existingEstimate) {
      throw new ApiError(404, 'Tax estimate not found');
    }

    // Merge incoming values with existing values for recalculation
    const country = data.country ?? existingEstimate.country;
    const state = data.state ?? existingEstimate.state;
    const quarter = data.quarter ?? existingEstimate.quarter;
    const grossIncomeForQuarter = data.grossIncomeForQuarter ?? existingEstimate.grossIncomeForQuarter;
    const businessExpenses = data.businessExpenses ?? existingEstimate.businessExpenses;
    const retirementContribution = data.retirementContribution ?? existingEstimate.retirementContribution;
    const healthInsurancePremiums = data.healthInsurancePremiums ?? existingEstimate.healthInsurancePremiums;
    const homeOfficeDeduction = data.homeOfficeDeduction ?? existingEstimate.homeOfficeDeduction;

    const filingStatus = data.filingStatus ?? existingEstimate.filingStatus;

    // Recalculate using tax utility
    const getCalculationYear = (q: string, date: Date): number => {
      const dueYear = date.getUTCFullYear();
      return q === 'Q4' ? dueYear - 1 : dueYear;
    };
    const year = data.year ?? getCalculationYear(existingEstimate.quarter, existingEstimate.dueDate);

    const calculation = computeTaxEstimate({
      country,
      state,
      quarter,
      year,
      grossIncomeForQuarter,
      businessExpenses,
      retirementContribution,
      healthInsurancePremiums,
      homeOfficeDeduction,
      filingStatus,
    });

    // Update document fields
    existingEstimate.country = country;
    existingEstimate.state = state || '';
    existingEstimate.quarter = calculation.quarter;
    existingEstimate.grossIncomeForQuarter = grossIncomeForQuarter;
    existingEstimate.businessExpenses = businessExpenses;
    existingEstimate.retirementContribution = retirementContribution;
    existingEstimate.healthInsurancePremiums = healthInsurancePremiums;
    existingEstimate.homeOfficeDeduction = homeOfficeDeduction;
    existingEstimate.estimatedTax = calculation.estimatedTax;
    existingEstimate.dueDate = calculation.dueDate;

    if (data.status !== undefined) existingEstimate.status = data.status;
    if (data.filingStatus !== undefined) existingEstimate.filingStatus = data.filingStatus;

    return await existingEstimate.save();
  }

  /**
   * Deletes a tax estimate by ID for the logged in user
   */
  public static async deleteTaxEstimate(
    userId: string,
    estimateId: string
  ): Promise<void> {
    const taxEstimate = await TaxEstimate.findOneAndDelete({ _id: estimateId, userId });
    if (!taxEstimate) {
      throw new ApiError(404, 'Tax estimate not found');
    }
  }
}
