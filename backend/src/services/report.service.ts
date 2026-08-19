import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import { Report, IReportDocument } from '../models/Report';
import { Transaction } from '../models/Transaction';
import { ApiError } from '../utils/ApiError';

export interface IGenerateReportInput {
  reportType: string;
  period: string;
  startDate?: string | Date;
  endDate?: string | Date;
  format: 'PDF' | 'CSV';
}

export class ReportService {
  /**
   * Determine start and end dates from period string
   */
  public static calculateDateRange(
    period: string,
    customStart?: string | Date,
    customEnd?: string | Date
  ): { periodStart: Date; periodEnd: Date; periodLabel: string } {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth(); // 0-11

    let periodStart: Date;
    let periodEnd: Date;
    let periodLabel = period;

    switch (period) {
      case 'Current Month':
      case 'Monthly': {
        periodStart = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
        periodEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
        periodLabel = now.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        break;
      }
      case 'Last Month': {
        const lastMonthDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
        const lmYear = lastMonthDate.getUTCFullYear();
        const lmMonth = lastMonthDate.getUTCMonth();
        periodStart = new Date(Date.UTC(lmYear, lmMonth, 1, 0, 0, 0, 0));
        periodEnd = new Date(Date.UTC(lmYear, lmMonth + 1, 0, 23, 59, 59, 999));
        periodLabel = lastMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        break;
      }
      case 'Current Quarter':
      case 'Quarterly': {
        const quarterIndex = Math.floor(currentMonth / 3); // 0 (Q1), 1 (Q2), 2 (Q3), 3 (Q4)
        const qStartMonth = quarterIndex * 3;
        periodStart = new Date(Date.UTC(currentYear, qStartMonth, 1, 0, 0, 0, 0));
        periodEnd = new Date(Date.UTC(currentYear, qStartMonth + 3, 0, 23, 59, 59, 999));
        periodLabel = `Q${quarterIndex + 1} ${currentYear}`;
        break;
      }
      case 'Last Quarter': {
        let quarterIndex = Math.floor(currentMonth / 3) - 1;
        let qYear = currentYear;
        if (quarterIndex < 0) {
          quarterIndex = 3;
          qYear = currentYear - 1;
        }
        const qStartMonth = quarterIndex * 3;
        periodStart = new Date(Date.UTC(qYear, qStartMonth, 1, 0, 0, 0, 0));
        periodEnd = new Date(Date.UTC(qYear, qStartMonth + 3, 0, 23, 59, 59, 999));
        periodLabel = `Q${quarterIndex + 1} ${qYear}`;
        break;
      }
      case 'Year to Date':
      case 'YTD': {
        periodStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
        periodEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
        periodLabel = `YTD ${currentYear}`;
        break;
      }
      case 'Annual':
      case 'Full Year': {
        periodStart = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
        periodEnd = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
        periodLabel = `Annual ${currentYear}`;
        break;
      }
      case 'Custom Range':
      case 'Custom': {
        if (!customStart || !customEnd) {
          throw new ApiError(400, 'Start and End dates are required for Custom period');
        }
        periodStart = new Date(customStart);
        periodStart.setUTCHours(0, 0, 0, 0);
        periodEnd = new Date(customEnd);
        periodEnd.setUTCHours(23, 59, 59, 999);
        periodLabel = `${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`;
        break;
      }
      default: {
        // Fallback default: current month
        periodStart = new Date(Date.UTC(currentYear, currentMonth, 1, 0, 0, 0, 0));
        periodEnd = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
        periodLabel = period;
        break;
      }
    }

    return { periodStart, periodEnd, periodLabel };
  }

  /**
   * Generate and persist a report for user.
   * The report data differs based on reportType:
   * - "Income Statement": income sources breakdown, profit/loss focus
   * - "Expense Breakdown": expense categories only
   * - "Income & Expense Summary": full combined view (income + expense categories + monthly)
   * - "Tax Summary": tax estimates, deductions, taxable income, estimated liability
   */
  public static async generateReport(userId: string, input: IGenerateReportInput): Promise<IReportDocument> {
    const { reportType, period, startDate, endDate, format } = input;

    const { periodStart, periodEnd, periodLabel } = this.calculateDateRange(period, startDate, endDate);

    // Fetch transactions within date range for the user
    const transactions = await Transaction.find({
      userId: new mongoose.Types.ObjectId(userId),
      transactionDate: { $gte: periodStart, $lte: periodEnd },
    }).sort({ transactionDate: -1 });

    let totalIncome = 0;
    let totalExpenses = 0;
    const expenseCategoryTotals: Record<string, { amount: number; count: number }> = {};
    const incomeCategoryTotals: Record<string, { amount: number; count: number }> = {};
    const monthlyMap: Record<string, { income: number; expenses: number }> = {};

    transactions.forEach((tx) => {
      const amount = tx.amount || 0;
      const txDate = new Date(tx.transactionDate);
      const monthKey = txDate.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { income: 0, expenses: 0 };
      }

      if (tx.type === 'Income') {
        totalIncome += amount;
        monthlyMap[monthKey].income += amount;

        const cat = tx.category || 'General';
        if (!incomeCategoryTotals[cat]) {
          incomeCategoryTotals[cat] = { amount: 0, count: 0 };
        }
        incomeCategoryTotals[cat].amount += amount;
        incomeCategoryTotals[cat].count += 1;
      } else if (tx.type === 'Expense') {
        totalExpenses += amount;
        monthlyMap[monthKey].expenses += amount;

        const cat = tx.category || 'General';
        if (!expenseCategoryTotals[cat]) {
          expenseCategoryTotals[cat] = { amount: 0, count: 0 };
        }
        expenseCategoryTotals[cat].amount += amount;
        expenseCategoryTotals[cat].count += 1;
      }
    });

    const netSavings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((netSavings / totalIncome) * 100) * 100) / 100 : 0;

    // Build expense category breakdown
    const categoryBreakdown = Object.entries(expenseCategoryTotals)
      .map(([category, info]) => ({
        category,
        amount: info.amount,
        percentage: totalExpenses > 0 ? Math.round((info.amount / totalExpenses) * 1000) / 10 : 0,
        count: info.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Build income category breakdown
    const incomeCategoryBreakdown = Object.entries(incomeCategoryTotals)
      .map(([category, info]) => ({
        category,
        amount: info.amount,
        percentage: totalIncome > 0 ? Math.round((info.amount / totalIncome) * 1000) / 10 : 0,
        count: info.count,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Build monthly breakdown
    const monthlyBreakdown = Object.entries(monthlyMap).map(([month, stats]) => ({
      month,
      income: stats.income,
      expenses: stats.expenses,
      netSavings: stats.income - stats.expenses,
    }));

    // Build report data based on report type
    let reportData: any;
    const incomeTransactions = transactions.filter(t => t.type === 'Income');
    const expenseTransactions = transactions.filter(t => t.type === 'Expense');

    switch (reportType) {
      case 'Income Statement':
      case 'Profit & Loss (P&L) Statement': {
        // Focus on income sources, revenue breakdown, and profit/loss
        reportData = {
          incomeCategoryBreakdown,
          monthlyBreakdown,
          transactionCount: transactions.length,
          incomeTransactionCount: incomeTransactions.length,
          expenseTransactionCount: expenseTransactions.length,
          savingsRate,
          recentTransactions: incomeTransactions.slice(0, 10).map((t) => ({
            id: t._id,
            date: t.transactionDate,
            description: t.description,
            category: t.category,
            type: t.type,
            amount: t.amount,
          })),
        };
        break;
      }

      case 'Expense Breakdown': {
        // Focus on expense categories, spending analysis
        const avgExpensePerTransaction = expenseTransactions.length > 0
          ? Math.round((totalExpenses / expenseTransactions.length) * 100) / 100
          : 0;
        const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0].category : 'N/A';

        reportData = {
          categoryBreakdown,
          monthlyBreakdown: monthlyBreakdown.map(m => ({
            month: m.month,
            income: 0,
            expenses: m.expenses,
            netSavings: -m.expenses,
          })),
          transactionCount: expenseTransactions.length,
          savingsRate,
          avgExpensePerTransaction,
          topExpenseCategory: topCategory,
          recentTransactions: expenseTransactions.slice(0, 10).map((t) => ({
            id: t._id,
            date: t.transactionDate,
            description: t.description,
            category: t.category,
            type: t.type,
            amount: t.amount,
          })),
        };
        break;
      }

      case 'Tax Summary':
      case 'Schedule C (Form 1040) Tax Summary':
      case 'Quarterly Tax Summary': {
        // Pull tax estimate data from TaxEstimate collection
        const TaxEstimate = (await import('../models/TaxEstimate')).TaxEstimate;
        const taxEstimates = await TaxEstimate.find({
          userId: new mongoose.Types.ObjectId(userId),
        }).sort({ createdAt: -1 });

        // Compute deduction-related expenses from transactions
        const deductibleCategories = [
          'Business', 'Office Supplies', 'Software/Tools', 'Professional Services',
          'Travel', 'Education', 'Insurance', 'Utilities', 'Rent', 'Marketing',
          'Equipment', 'Hardware/Gadgets', 'Subscriptions'
        ];

        // Determine if report country is India (INR)
        const latestEstimate = taxEstimates.length > 0 ? taxEstimates[0] : null;
        const reportCountry = latestEstimate?.country || 'United States';
        const isReportINR = reportCountry.trim().toLowerCase() === 'india';

        // Normalized transaction calculations (USD raw transactions converted to INR if report is in INR)
        const totalIncomeNormalized = isReportINR ? totalIncome * 83 : totalIncome;
        const totalExpensesNormalized = isReportINR ? totalExpenses * 83 : totalExpenses;

        const deductionBreakdown: Array<{ category: string; amount: number; count: number }> = [];
        let totalDeductible = 0;

        categoryBreakdown.forEach(cat => {
          const isDeductible = deductibleCategories.some(
            dc => cat.category.toLowerCase().includes(dc.toLowerCase())
          );
          if (isDeductible) {
            const normalizedAmt = isReportINR ? cat.amount * 83 : cat.amount;
            deductionBreakdown.push({
              category: cat.category,
              amount: Number(normalizedAmt.toFixed(2)),
              count: cat.count,
            });
            totalDeductible += normalizedAmt;
          }
        });

        const taxableIncome = totalIncomeNormalized - totalDeductible;

        // Aggregate quarterly estimates within the report period, normalising values (INR vs USD conversion)
        const quarterlyEstimates = taxEstimates
          .filter(te => {
            const created = new Date(te.createdAt);
            return created >= periodStart && created <= periodEnd;
          })
          .map(te => {
            const isEstINR = te.country.trim().toLowerCase() === 'india';
            let gross = te.grossIncomeForQuarter;
            let estTax = te.estimatedTax;
            let bizExp = te.businessExpenses || 0;
            let retCont = te.retirementContribution || 0;
            let healthIns = te.healthInsurancePremiums || 0;
            let homeOff = te.homeOfficeDeduction || 0;

            if (isEstINR && !isReportINR) {
              // Convert INR estimate to USD
              gross = Number((gross / 83).toFixed(2));
              estTax = Number((estTax / 83).toFixed(2));
              bizExp = Number((bizExp / 83).toFixed(2));
              retCont = Number((retCont / 83).toFixed(2));
              healthIns = Number((healthIns / 83).toFixed(2));
              homeOff = Number((homeOff / 83).toFixed(2));
            } else if (!isEstINR && isReportINR) {
              // Convert USD estimate to INR
              gross = Number((gross * 83).toFixed(2));
              estTax = Number((estTax * 83).toFixed(2));
              bizExp = Number((bizExp * 83).toFixed(2));
              retCont = Number((retCont * 83).toFixed(2));
              healthIns = Number((healthIns * 83).toFixed(2));
              homeOff = Number((homeOff * 83).toFixed(2));
            }

            return {
              quarter: te.quarter,
              grossIncome: gross,
              estimatedTax: estTax,
              dueDate: te.dueDate,
              status: te.status,
              country: te.country,
              businessExpenses: bizExp,
              retirementContribution: retCont,
              healthInsurancePremiums: healthIns,
              homeOfficeDeduction: homeOff,
            };
          });

        const totalEstimatedTax = quarterlyEstimates.reduce((sum, qe) => sum + qe.estimatedTax, 0);

        // Effective Tax Rate based on normalized values
        const effectiveTaxRate = latestEstimate && latestEstimate.grossIncomeForQuarter > 0
          ? Math.round(((latestEstimate.estimatedTax / latestEstimate.grossIncomeForQuarter) * 100) * 100) / 100
          : 0;

        reportData = {
          categoryBreakdown: categoryBreakdown.map(cat => ({
            category: cat.category,
            amount: Number((isReportINR ? cat.amount * 83 : cat.amount).toFixed(2)),
            percentage: cat.percentage,
            count: cat.count
          })),
          monthlyBreakdown: monthlyBreakdown.map(m => ({
            month: m.month,
            income: Number((isReportINR ? m.income * 83 : m.income).toFixed(2)),
            expenses: Number((isReportINR ? m.expenses * 83 : m.expenses).toFixed(2)),
            netSavings: Number((isReportINR ? m.netSavings * 83 : m.netSavings).toFixed(2))
          })),
          transactionCount: transactions.length,
          savingsRate,
          taxableIncome: Math.max(0, Number(taxableIncome.toFixed(2))),
          totalDeductible: Number(totalDeductible.toFixed(2)),
          deductionBreakdown,
          effectiveTaxRate,
          estimatedAnnualTax: quarterlyEstimates.length > 0 ? (quarterlyEstimates[0].estimatedTax * 4) : 0,
          totalEstimatedTax: Number(totalEstimatedTax.toFixed(2)),
          quarterlyEstimates,
          country: reportCountry,
        };
        break;
      }

      case 'Income & Expense Summary':
      default: {
        // Full combined view — the original behavior
        reportData = {
          categoryBreakdown,
          incomeCategoryBreakdown,
          monthlyBreakdown,
          transactionCount: transactions.length,
          incomeTransactionCount: incomeTransactions.length,
          expenseTransactionCount: expenseTransactions.length,
          savingsRate,
          recentTransactions: transactions.slice(0, 10).map((t) => ({
            id: t._id,
            date: t.transactionDate,
            description: t.description,
            category: t.category,
            type: t.type,
            amount: t.amount,
          })),
        };
        break;
      }
    }

    const report = new Report({
      userId: new mongoose.Types.ObjectId(userId),
      period: periodLabel,
      periodStart,
      periodEnd,
      reportType: reportType || 'Income & Expense Summary',
      format: format || 'PDF',
      totalIncome,
      totalExpenses,
      netSavings,
      filePath: '',
      data: reportData,
    });

    return await report.save();
  }

  /**
   * Get all user reports
   */
  public static async getReports(userId: string): Promise<IReportDocument[]> {
    return await Report.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  /**
   * Get single report by ID
   */
  public static async getReportById(userId: string, reportId: string): Promise<IReportDocument> {
    const report = await Report.findOne({
      _id: new mongoose.Types.ObjectId(reportId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!report) {
      throw new ApiError(404, 'Report not found');
    }
    return report;
  }

  /**
   * Delete report
   */
  public static async deleteReport(userId: string, reportId: string): Promise<void> {
    const result = await Report.findOneAndDelete({
      _id: new mongoose.Types.ObjectId(reportId),
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (!result) {
      throw new ApiError(404, 'Report not found');
    }
  }

  /**
   * Generate CSV buffer from Report — output differs based on reportType
   */
  public static generateCSV(report: IReportDocument): Buffer {
    const lines: string[] = [];
    const fmtAmt = (n: number | undefined) => n !== undefined ? (n || 0).toFixed(2) : '';
    const fmtPercent = (n: number | undefined) => n !== undefined ? (n || 0).toFixed(2) + '%' : '';
    const formatDate = (dateInput: any) => {
      if (!dateInput) return '';
      try {
        const d = new Date(dateInput);
        if (isNaN(d.getTime())) return '';
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} `; // Trailing space forces Excel to treat it as plain text to prevent hashing
      } catch (e) {
        return '';
      }
    };

    const rType = report.reportType || 'Summary';
    const period = report.period || 'N/A';
    const range = `${formatDate(report.periodStart)}to ${formatDate(report.periodEnd)}`;

    // Single-table Header Row
    lines.push(`"Report Type","Period","Date Range","Section","Category/Metric","Amount ($)","Share (%)","Transactions Count","Date / Due Date","Status"`);

    const addRow = (section: string, catOrMetric: string, amount?: number, percent?: number, count?: number, date?: any, status?: string) => {
      const row = [
        `"${rType.replace(/"/g, '""')}"`,
        `"${period.replace(/"/g, '""')}"`,
        `"${range.replace(/"/g, '""')}"`,
        `"${section.replace(/"/g, '""')}"`,
        `"${catOrMetric.replace(/"/g, '""')}"`,
        fmtAmt(amount),
        fmtPercent(percent),
        count !== undefined ? String(count) : '',
        date ? `"${formatDate(date)}"` : '',
        status ? `"${status.replace(/"/g, '""')}"` : ''
      ];
      lines.push(row.join(','));
    };

    switch (report.reportType) {
      case 'Income Statement':
      case 'Profit & Loss (P&L) Statement': {
        // Summary Metrics
        addRow('Profit & Loss Summary', 'Total Revenue', report.totalIncome);
        addRow('Profit & Loss Summary', 'Total Costs', report.totalExpenses);
        addRow('Profit & Loss Summary', 'Net Profit / Loss', report.netSavings);
        addRow('Profit & Loss Summary', 'Profit Margin', undefined, report.data?.savingsRate);

        // Income Sources
        const incomeCats = report.data?.incomeCategoryBreakdown || [];
        incomeCats.forEach((cat: any) => {
          addRow('Revenue Sources', cat.category, cat.amount, cat.percentage, cat.count);
        });

        // Monthly Breakdown
        const monthly = report.data?.monthlyBreakdown || [];
        monthly.forEach((m: any) => {
          addRow('Monthly Profit & Loss', `${m.month} Revenue`, m.income);
          addRow('Monthly Profit & Loss', `${m.month} Costs`, m.expenses);
          addRow('Monthly Profit & Loss', `${m.month} Net Profit`, m.netSavings);
        });

        // Recent Income Transactions
        const txs = report.data?.recentTransactions || [];
        txs.forEach((tx: any) => {
          addRow('Recent Income Transactions', tx.description || 'N/A', tx.amount, undefined, undefined, tx.date, tx.category);
        });
        break;
      }

      case 'Expense Breakdown': {
        // Spending Summary
        addRow('Spending Summary', 'Total Spending', report.totalExpenses);
        addRow('Spending Summary', 'Expense Transactions', undefined, undefined, report.data?.transactionCount);
        addRow('Spending Summary', 'Avg per Transaction', report.data?.avgExpensePerTransaction);
        addRow('Spending Summary', 'Top Category', undefined, undefined, undefined, undefined, report.data?.topExpenseCategory);

        // Spending by Category
        const cats = report.data?.categoryBreakdown || [];
        cats.forEach((cat: any) => {
          addRow('Spending by Category', cat.category, cat.amount, cat.percentage, cat.count);
        });

        // Monthly Spending
        const monthly = report.data?.monthlyBreakdown || [];
        monthly.forEach((m: any) => {
          addRow('Monthly Spending Trend', m.month, m.expenses);
        });

        // Recent Expense Transactions
        const txs = report.data?.recentTransactions || [];
        txs.forEach((tx: any) => {
          addRow('Recent Expense Transactions', tx.description || 'N/A', tx.amount, undefined, undefined, tx.date, tx.category);
        });
        break;
      }

      case 'Tax Summary':
      case 'Schedule C (Form 1040) Tax Summary':
      case 'Quarterly Tax Summary': {
        // Tax Overview
        addRow('Tax Overview', 'Gross Income', report.totalIncome);
        addRow('Tax Overview', 'Total Deductions', report.data?.totalDeductible);
        addRow('Tax Overview', 'Taxable Income', report.data?.taxableIncome);
        addRow('Tax Overview', 'Effective Tax Rate', undefined, report.data?.effectiveTaxRate);
        addRow('Tax Overview', 'Estimated Annual Tax', report.data?.estimatedAnnualTax);
        addRow('Tax Overview', 'Total Estimated Tax (Period)', report.data?.totalEstimatedTax);
        addRow('Tax Overview', 'Country', undefined, undefined, undefined, undefined, report.data?.country);

        // Deductions
        const deductions = report.data?.deductionBreakdown || [];
        deductions.forEach((d: any) => {
          addRow('Deductible Expenses', d.category, d.amount, undefined, d.count);
        });

        // Quarterly Estimates
        const qEstimates = report.data?.quarterlyEstimates || [];
        qEstimates.forEach((qe: any) => {
          addRow('Quarterly Tax Estimates', qe.quarter, qe.grossIncome, undefined, undefined, qe.dueDate, qe.status);
        });

        // All Expense Categories
        const cats = report.data?.categoryBreakdown || [];
        cats.forEach((cat: any) => {
          addRow('All Expense Categories', cat.category, cat.amount, cat.percentage, cat.count);
        });
        break;
      }

      case 'Income & Expense Summary':
      default: {
        // Summary
        addRow('Financial Summary', 'Total Income', report.totalIncome);
        addRow('Financial Summary', 'Total Expenses', report.totalExpenses);
        addRow('Financial Summary', 'Net Savings', report.netSavings);
        addRow('Financial Summary', 'Savings Rate', undefined, report.data?.savingsRate);

        // Income Categories
        const incomeCats = report.data?.incomeCategoryBreakdown || [];
        incomeCats.forEach((cat: any) => {
          addRow('Income Sources', cat.category, cat.amount, cat.percentage, cat.count);
        });

        // Expense Categories
        const expenseCats = report.data?.categoryBreakdown || [];
        expenseCats.forEach((cat: any) => {
          addRow('Expense Breakdown', cat.category, cat.amount, cat.percentage, cat.count);
        });

        // Monthly Breakdown
        const monthly = report.data?.monthlyBreakdown || [];
        monthly.forEach((m: any) => {
          addRow('Monthly Breakdown', `${m.month} Income`, m.income);
          addRow('Monthly Breakdown', `${m.month} Expenses`, m.expenses);
          addRow('Monthly Breakdown', `${m.month} Net Savings`, m.netSavings);
        });
        break;
      }
    }

    return Buffer.from(lines.join('\n'), 'utf-8');
  }

  /**
   * Generate PDF buffer from Report using PDFKit — output differs based on reportType
   */
  public static async generatePDF(report: IReportDocument, userName = 'Freelancer'): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Color palette
      const primaryColor = '#1e3a8a';
      const textColor = '#334155';
      const grayBg = '#f1f5f9';
      const greenColor = '#10b981';
      const redColor = '#ef4444';
      const purpleColor = '#a855f7';
      const blueColor = '#3b82f6';

      const getCurrencySymbol = (countryName: string) => {
        const c = (countryName || '').trim().toLowerCase();
        if (c === 'india' || c === 'in') return 'Rs.';
        if (c === 'japan' || c === 'jp' || c === 'china' || c === 'cn') return '¥';
        if (c === 'germany' || c === 'de' || c === 'france' || c === 'fr') return 'EUR';
        if (c === 'united kingdom' || c === 'uk' || c === 'gb') return '£';
        if (c === 'switzerland' || c === 'ch') return 'CHF';
        if (c === 'singapore' || c === 'sg') return 'S$';
        return '$';
      };
      const fmtMoney = (n: number) => {
        const sym = getCurrencySymbol(report.data?.country || 'USA');
        return sym + ' ' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      };

      // ===== Common Header Banner =====
      doc.rect(40, 40, 515, 65).fill('#0f172a');
      doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('TaxPal Financial Report', 55, 52);
      doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text(`Generated for ${userName} | ${new Date(report.createdAt).toLocaleDateString()}`, 55, 80);

      doc.moveDown(3);

      // ===== Report Info Meta Card =====
      const metaY = 120;
      doc.rect(40, metaY, 515, 50).fill(grayBg);
      doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold');
      doc.text(`Report Type: `, 55, metaY + 12, { continued: true }).font('Helvetica').text(report.reportType);
      doc.font('Helvetica-Bold').text(`Period: `, 55, metaY + 28, { continued: true }).font('Helvetica').text(report.period);
      doc.font('Helvetica-Bold').text(`Format: `, 320, metaY + 12, { continued: true }).font('Helvetica').text(report.format);
      doc.font('Helvetica-Bold').text(`Transactions: `, 320, metaY + 28, { continued: true }).font('Helvetica').text(`${report.data?.transactionCount || 0}`);

      // ===== Helper: Draw a metric card =====
      const drawMetricCard = (x: number, y: number, w: number, h: number, label: string, value: string, bgColor: string, borderColor: string, labelColor: string, valueColor: string) => {
        doc.rect(x, y, w, h).fill(bgColor).stroke(borderColor);
        doc.fillColor(labelColor).fontSize(10).font('Helvetica-Bold').text(label, x + 12, y + 14);
        doc.fillColor(valueColor).fontSize(16).font('Helvetica-Bold').text(value, x + 12, y + 36);
      };

      // ===== Helper: Draw a table header row =====
      const drawTableHeader = (y: number, columns: Array<{ label: string; x: number; width: number; align?: string }>) => {
        doc.rect(40, y, 515, 22).fill('#1e293b');
        doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
        columns.forEach(col => {
          doc.text(col.label, col.x, y + 6, { width: col.width, align: (col.align as any) || 'left' });
        });
        return y + 22;
      };

      // ===== Helper: Draw a table data row =====
      const drawTableRow = (y: number, idx: number, columns: Array<{ value: string; x: number; width: number; align?: string; color?: string }>) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, y, 515, 20).fill(bg);
        doc.fontSize(9).font('Helvetica');
        columns.forEach(col => {
          doc.fillColor(col.color || '#334155');
          doc.text(col.value, col.x, y + 5, { width: col.width, align: (col.align as any) || 'left' });
        });
        return y + 20;
      };

      // ===== Helper: Draw the monthly breakdown table =====
      const drawMonthlyTable = (startY: number, monthly: any[], headings: { col1: string; col2: string; col3: string; col4: string }, showIncome = true) => {
        let y = startY;
        doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text(headings.col1, 40, y);
        y += 22;

        if (showIncome) {
          y = drawTableHeader(y, [
            { label: 'Month', x: 50, width: 140 },
            { label: headings.col2, x: 200, width: 100, align: 'right' },
            { label: headings.col3, x: 320, width: 100, align: 'right' },
            { label: headings.col4, x: 440, width: 105, align: 'right' },
          ]);
          monthly.forEach((m, idx) => {
            y = drawTableRow(y, idx, [
              { value: m.month, x: 50, width: 140 },
              { value: fmtMoney(m.income), x: 200, width: 100, align: 'right' },
              { value: fmtMoney(m.expenses), x: 320, width: 100, align: 'right' },
              { value: fmtMoney(m.netSavings), x: 440, width: 105, align: 'right', color: m.netSavings >= 0 ? greenColor : redColor },
            ]);
          });
        } else {
          y = drawTableHeader(y, [
            { label: 'Month', x: 50, width: 250 },
            { label: headings.col3, x: 320, width: 225, align: 'right' },
          ]);
          monthly.forEach((m, idx) => {
            y = drawTableRow(y, idx, [
              { value: m.month, x: 50, width: 250 },
              { value: fmtMoney(m.expenses), x: 320, width: 225, align: 'right', color: redColor },
            ]);
          });
        }

        return y;
      };

      // ===== Type-specific content =====
      const cardY = 185;
      const cardWidth = 120;
      const cardHeight = 70;

      switch (report.reportType) {

        case 'Income Statement':
        case 'Profit & Loss (P&L) Statement': {
          // Metric Cards: Revenue | Costs | Net Profit | Profit Margin
          drawMetricCard(40, cardY, cardWidth, cardHeight, 'TOTAL REVENUE', fmtMoney(report.totalIncome), '#ecfdf5', '#a7f3d0', '#065f46', greenColor);
          drawMetricCard(170, cardY, cardWidth, cardHeight, 'TOTAL COSTS', fmtMoney(report.totalExpenses), '#fef2f2', '#fecaca', '#991b1b', redColor);
          const npColor = report.netSavings >= 0 ? greenColor : redColor;
          const npBg = report.netSavings >= 0 ? '#ecfdf5' : '#fef2f2';
          const npBorder = report.netSavings >= 0 ? '#a7f3d0' : '#fecaca';
          drawMetricCard(300, cardY, cardWidth + 10, cardHeight, 'NET PROFIT / LOSS', fmtMoney(report.netSavings), npBg, npBorder, '#1e293b', npColor);
          drawMetricCard(440, cardY, cardWidth + 5, cardHeight, 'PROFIT MARGIN', `${report.data?.savingsRate || 0}%`, '#f5f3ff', '#ddd6fe', '#5b21b6', purpleColor);

          let currentY = 275;

          // Revenue Sources Table
          const incomeCats = (report.data as any)?.incomeCategoryBreakdown || [];
          if (incomeCats.length > 0) {
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Revenue Sources', 40, currentY);
            currentY += 22;
            currentY = drawTableHeader(currentY, [
              { label: 'Source', x: 50, width: 200 },
              { label: 'Amount', x: 260, width: 90, align: 'right' },
              { label: 'Share (%)', x: 370, width: 80, align: 'right' },
              { label: 'Transactions', x: 470, width: 75, align: 'right' },
            ]);
            incomeCats.forEach((cat: any, idx: number) => {
              currentY = drawTableRow(currentY, idx, [
                { value: cat.category, x: 50, width: 200 },
                { value: fmtMoney(cat.amount), x: 260, width: 90, align: 'right', color: greenColor },
                { value: `${cat.percentage}%`, x: 370, width: 80, align: 'right' },
                { value: `${cat.count}`, x: 470, width: 75, align: 'right' },
              ]);
            });
            currentY += 20;
          }

          // Monthly P&L
          const monthly = report.data?.monthlyBreakdown || [];
          if (monthly.length > 0 && currentY < 650) {
            drawMonthlyTable(currentY, monthly, { col1: 'Monthly Profit & Loss', col2: 'Revenue', col3: 'Costs', col4: 'Net Profit' });
          }
          break;
        }

        case 'Expense Breakdown': {
          // Metric Cards: Total Spending | Expense Txns | Avg per Txn | Top Category
          drawMetricCard(40, cardY, cardWidth, cardHeight, 'TOTAL SPENDING', fmtMoney(report.totalExpenses), '#fef2f2', '#fecaca', '#991b1b', redColor);
          drawMetricCard(170, cardY, cardWidth, cardHeight, 'EXPENSE TXNS', `${report.data?.transactionCount || 0}`, '#f5f3ff', '#ddd6fe', '#5b21b6', purpleColor);
          drawMetricCard(300, cardY, cardWidth + 10, cardHeight, 'AVG PER TXN', fmtMoney((report.data as any)?.avgExpensePerTransaction || 0), '#eff6ff', '#bfdbfe', '#1e3a8a', blueColor);
          const topCat = (report.data as any)?.topExpenseCategory || 'N/A';
          drawMetricCard(440, cardY, cardWidth + 5, cardHeight, 'TOP CATEGORY', topCat.length > 12 ? topCat.substring(0, 12) + '...' : topCat, '#ecfdf5', '#a7f3d0', '#065f46', greenColor);

          let currentY = 275;

          // Spending by Category Table
          const cats = report.data?.categoryBreakdown || [];
          if (cats.length > 0) {
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Spending by Category', 40, currentY);
            currentY += 22;
            currentY = drawTableHeader(currentY, [
              { label: 'Category', x: 50, width: 200 },
              { label: 'Amount', x: 260, width: 90, align: 'right' },
              { label: 'Share (%)', x: 370, width: 80, align: 'right' },
              { label: 'Transactions', x: 470, width: 75, align: 'right' },
            ]);
            cats.forEach((cat, idx) => {
              currentY = drawTableRow(currentY, idx, [
                { value: cat.category, x: 50, width: 200 },
                { value: fmtMoney(cat.amount), x: 260, width: 90, align: 'right', color: redColor },
                { value: `${cat.percentage}%`, x: 370, width: 80, align: 'right' },
                { value: `${cat.count}`, x: 470, width: 75, align: 'right' },
              ]);
            });
            currentY += 20;
          }

          // Monthly Spending Trend (expenses only)
          const monthly = report.data?.monthlyBreakdown || [];
          if (monthly.length > 0 && currentY < 650) {
            drawMonthlyTable(currentY, monthly, { col1: 'Monthly Spending Trend', col2: '', col3: 'Expenses', col4: '' }, false);
          }
          break;
        }

        case 'Tax Summary':
        case 'Schedule C (Form 1040) Tax Summary':
        case 'Quarterly Tax Summary': {
          // Metric Cards: Gross Income | Total Deductions | Taxable Income | Estimated Tax
          drawMetricCard(40, cardY, cardWidth, cardHeight, 'GROSS INCOME', fmtMoney(report.totalIncome), '#ecfdf5', '#a7f3d0', '#065f46', greenColor);
          drawMetricCard(170, cardY, cardWidth, cardHeight, 'DEDUCTIONS', fmtMoney((report.data as any)?.totalDeductible || 0), '#fef2f2', '#fecaca', '#991b1b', redColor);
          drawMetricCard(300, cardY, cardWidth + 10, cardHeight, 'TAXABLE INCOME', fmtMoney((report.data as any)?.taxableIncome || 0), '#eff6ff', '#bfdbfe', '#1e3a8a', blueColor);
          const estTax = (report.data as any)?.totalEstimatedTax || (report.data as any)?.estimatedAnnualTax || 0;
          drawMetricCard(440, cardY, cardWidth + 5, cardHeight, 'ESTIMATED TAX', fmtMoney(estTax), '#f5f3ff', '#ddd6fe', '#5b21b6', purpleColor);

          let currentY = 275;

          // Tax Overview Info
          doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Tax Overview', 40, currentY);
          currentY += 22;
          doc.rect(40, currentY, 515, 45).fill(grayBg);
          doc.fillColor(textColor).fontSize(10).font('Helvetica-Bold');
          doc.text(`Country: `, 55, currentY + 8, { continued: true }).font('Helvetica').text(`${(report.data as any)?.country || 'N/A'}`);
          doc.font('Helvetica-Bold').text(`Effective Tax Rate: `, 55, currentY + 24, { continued: true }).font('Helvetica').text(`${(report.data as any)?.effectiveTaxRate || 0}%`);
          doc.font('Helvetica-Bold').text(`Est. Annual Tax: `, 320, currentY + 8, { continued: true }).font('Helvetica').text(fmtMoney((report.data as any)?.estimatedAnnualTax || 0));
          currentY += 55;

          // Deduction Breakdown
          const deductions = (report.data as any)?.deductionBreakdown || [];
          if (deductions.length > 0) {
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Deductible Expenses', 40, currentY);
            currentY += 22;
            currentY = drawTableHeader(currentY, [
              { label: 'Category', x: 50, width: 250 },
              { label: 'Amount', x: 320, width: 120, align: 'right' },
              { label: 'Transactions', x: 460, width: 85, align: 'right' },
            ]);
            deductions.forEach((d: any, idx: number) => {
              currentY = drawTableRow(currentY, idx, [
                { value: d.category, x: 50, width: 250 },
                { value: fmtMoney(d.amount), x: 320, width: 120, align: 'right', color: greenColor },
                { value: `${d.count}`, x: 460, width: 85, align: 'right' },
              ]);
            });
            // Total deductions row
            doc.rect(40, currentY, 515, 22).fill('#e2e8f0');
            doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold');
            doc.text('Total Deductions', 50, currentY + 6);
            doc.text(fmtMoney((report.data as any)?.totalDeductible || 0), 320, currentY + 6, { width: 120, align: 'right' });
            currentY += 32;
          }

          // Quarterly Tax Estimates
          const qEstimates = (report.data as any)?.quarterlyEstimates || [];
          if (qEstimates.length > 0 && currentY < 620) {
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Quarterly Tax Estimates', 40, currentY);
            currentY += 22;
            currentY = drawTableHeader(currentY, [
              { label: 'Quarter', x: 50, width: 70 },
              { label: 'Gross Income', x: 130, width: 100, align: 'right' },
              { label: 'Estimated Tax', x: 250, width: 100, align: 'right' },
              { label: 'Due Date', x: 370, width: 90, align: 'right' },
              { label: 'Status', x: 470, width: 75, align: 'right' },
            ]);
            qEstimates.forEach((qe: any, idx: number) => {
              const dueDate = new Date(qe.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              currentY = drawTableRow(currentY, idx, [
                { value: qe.quarter, x: 50, width: 70 },
                { value: fmtMoney(qe.grossIncome), x: 130, width: 100, align: 'right' },
                { value: fmtMoney(qe.estimatedTax), x: 250, width: 100, align: 'right', color: redColor },
                { value: dueDate, x: 370, width: 90, align: 'right' },
                { value: qe.status || 'Pending', x: 470, width: 75, align: 'right', color: qe.status === 'Paid' ? greenColor : '#f59e0b' },
              ]);
            });
          }
          break;
        }

        case 'Income & Expense Summary':
        default: {
          // Metric Cards: Income | Expenses | Net Savings | Savings Rate
          drawMetricCard(40, cardY, cardWidth, cardHeight, 'TOTAL INCOME', fmtMoney(report.totalIncome), '#ecfdf5', '#a7f3d0', '#065f46', greenColor);
          drawMetricCard(170, cardY, cardWidth, cardHeight, 'TOTAL EXPENSES', fmtMoney(report.totalExpenses), '#fef2f2', '#fecaca', '#991b1b', redColor);
          const savColor = report.netSavings >= 0 ? greenColor : redColor;
          const savBg = report.netSavings >= 0 ? '#ecfdf5' : '#fef2f2';
          const savBorder = report.netSavings >= 0 ? '#a7f3d0' : '#fecaca';
          drawMetricCard(300, cardY, cardWidth + 10, cardHeight, 'NET SAVINGS', fmtMoney(report.netSavings), savBg, savBorder, '#1e293b', savColor);
          drawMetricCard(440, cardY, cardWidth + 5, cardHeight, 'SAVINGS RATE', `${report.data?.savingsRate || 0}%`, '#f5f3ff', '#ddd6fe', '#5b21b6', purpleColor);

          let currentY = 275;

          // Income Sources Table
          const incomeCats = (report.data as any)?.incomeCategoryBreakdown || [];
          if (incomeCats.length > 0) {
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Income Sources', 40, currentY);
            currentY += 22;
            currentY = drawTableHeader(currentY, [
              { label: 'Source', x: 50, width: 200 },
              { label: 'Amount', x: 260, width: 90, align: 'right' },
              { label: 'Share (%)', x: 370, width: 80, align: 'right' },
              { label: 'Transactions', x: 470, width: 75, align: 'right' },
            ]);
            incomeCats.forEach((cat: any, idx: number) => {
              currentY = drawTableRow(currentY, idx, [
                { value: cat.category, x: 50, width: 200 },
                { value: fmtMoney(cat.amount), x: 260, width: 90, align: 'right', color: greenColor },
                { value: `${cat.percentage}%`, x: 370, width: 80, align: 'right' },
                { value: `${cat.count}`, x: 470, width: 75, align: 'right' },
              ]);
            });
            currentY += 20;
          }

          // Expense Category Breakdown
          const cats = report.data?.categoryBreakdown || [];
          if (cats.length > 0 && currentY < 600) {
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold').text('Expense Breakdown by Category', 40, currentY);
            currentY += 22;
            currentY = drawTableHeader(currentY, [
              { label: 'Category', x: 50, width: 200 },
              { label: 'Amount', x: 260, width: 90, align: 'right' },
              { label: 'Share (%)', x: 370, width: 80, align: 'right' },
              { label: 'Transactions', x: 470, width: 75, align: 'right' },
            ]);
            cats.forEach((cat, idx) => {
              currentY = drawTableRow(currentY, idx, [
                { value: cat.category, x: 50, width: 200 },
                { value: fmtMoney(cat.amount), x: 260, width: 90, align: 'right' },
                { value: `${cat.percentage}%`, x: 370, width: 80, align: 'right' },
                { value: `${cat.count}`, x: 470, width: 75, align: 'right' },
              ]);
            });
            currentY += 20;
          }

          // Monthly Breakdown
          const monthly = report.data?.monthlyBreakdown || [];
          if (monthly.length > 0 && currentY < 650) {
            drawMonthlyTable(currentY, monthly, { col1: 'Monthly Breakdown', col2: 'Income', col3: 'Expenses', col4: 'Net Savings' });
          }
          break;
        }
      }

      // Footer
      doc.fontSize(8).fillColor('#94a3b8').text('Generated by TaxPal • Confidential Financial Document', 40, 780, { align: 'center', width: 515 });

      doc.end();
    });
  }
}
