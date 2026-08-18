import { Request, Response } from 'express';
import { TaxEstimate } from '../models/TaxEstimate';
import { computeTaxEstimate } from '../utils/taxCalculator';

export const simulateTax = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { hypotheticalScenario, currentScenario } = req.body;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!hypotheticalScenario) {
      res.status(400).json({ success: false, message: 'Hypothetical scenario is required for simulation.' });
      return;
    }

    // Determine current scenario: use provided or fetch from DB
    let currentInput = currentScenario;
    if (!currentInput) {
      const latestEstimate = await TaxEstimate.findOne({ userId }).sort({ createdAt: -1 });
      if (latestEstimate) {
        currentInput = {
          country: latestEstimate.country || 'usa',
          grossIncomeForQuarter: latestEstimate.grossIncomeForQuarter || 0,
          businessExpenses: latestEstimate.businessExpenses || 0,
          retirementContribution: latestEstimate.retirementContribution || 0,
          healthInsurancePremiums: latestEstimate.healthInsurancePremiums || 0,
          homeOfficeDeduction: latestEstimate.homeOfficeDeduction || 0,
          filingStatus: latestEstimate.filingStatus || 'single',
          state: (latestEstimate as any).state || '',
        };
      } else {
        // Fallback default
        currentInput = {
          country: 'usa',
          grossIncomeForQuarter: 0,
        };
      }
    }

    // Ensure hypothetical has country (inherit from current if missing)
    const hypotheticalInput = {
      ...currentInput, // Inherit missing fields from current
      ...hypotheticalScenario,
    };

    // Calculate both
    const currentResult = computeTaxEstimate(currentInput);
    const hypotheticalResult = computeTaxEstimate(hypotheticalInput);

    // Compare
    const taxDifference = Number((hypotheticalResult.estimatedTax - currentResult.estimatedTax).toFixed(2));
    
    let percentageChange = 0;
    if (currentResult.estimatedTax > 0) {
      percentageChange = Number(((taxDifference / currentResult.estimatedTax) * 100).toFixed(2));
    } else if (taxDifference > 0) {
      percentageChange = 100; // From 0 to something
    }

    // Return results WITHOUT saving to database
    res.status(200).json({
      success: true,
      message: 'Simulation completed successfully.',
      isSimulation: true,
      comparison: {
        current: {
          taxableIncome: currentResult.taxableIncome,
          annualEstimatedTax: currentResult.annualEstimatedTax,
          estimatedTax: currentResult.estimatedTax,
        },
        hypothetical: {
          taxableIncome: hypotheticalResult.taxableIncome,
          annualEstimatedTax: hypotheticalResult.annualEstimatedTax,
          estimatedTax: hypotheticalResult.estimatedTax,
        },
        difference: {
          taxDifference,
          percentageChange,
        }
      }
    });

  } catch (error: any) {
    console.error('Tax Simulation Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
