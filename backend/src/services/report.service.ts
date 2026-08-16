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
      case 'Income Statement': {
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

      case 'Tax Summary': {
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
        const deductionBreakdown: Array<{ category: string; amount: number; count: number }> = [];
        let totalDeductible = 0;

        categoryBreakdown.forEach(cat => {
          const isDeductible = deductibleCategories.some(
            dc => cat.category.toLowerCase().includes(dc.toLowerCase())
          );
          if (isDeductible) {
            deductionBreakdown.push({
              category: cat.category,
              amount: cat.amount,
              count: cat.count,
            });
            totalDeductible += cat.amount;
          }
        });

        // Use the most recent tax estimate for tax rate / liability info
        const latestEstimate = taxEstimates.length > 0 ? taxEstimates[0] : null;
        const taxableIncome = totalIncome - totalDeductible;
        const effectiveTaxRate = latestEstimate && latestEstimate.grossIncomeForQuarter > 0
          ? Math.round(((latestEstimate.estimatedTax / latestEstimate.grossIncomeForQuarter) * 100) * 100) / 100
          : 0;

        // Aggregate quarterly estimates within the report period
        const quarterlyEstimates = taxEstimates
          .filter(te => {
            const created = new Date(te.createdAt);
            return created >= periodStart && created <= periodEnd;
          })
          .map(te => ({
            quarter: te.quarter,
            grossIncome: te.grossIncomeForQuarter,
            estimatedTax: te.estimatedTax,
            dueDate: te.dueDate,
            status: te.status,
            country: te.country,
            businessExpenses: te.businessExpenses || 0,
            retirementContribution: te.retirementContribution || 0,
            healthInsurancePremiums: te.healthInsurancePremiums || 0,
            homeOfficeDeduction: te.homeOfficeDeduction || 0,
          }));

        const totalEstimatedTax = quarterlyEstimates.reduce((sum, qe) => sum + qe.estimatedTax, 0);

        reportData = {
          categoryBreakdown,
          monthlyBreakdown,
          transactionCount: transactions.length,
          savingsRate,
          taxableIncome: Math.max(0, taxableIncome),
          totalDeductible,
          deductionBreakdown,
          effectiveTaxRate,
          estimatedAnnualTax: latestEstimate ? (latestEstimate.estimatedTax * 4) : 0,
          totalEstimatedTax,
          quarterlyEstimates,
          country: latestEstimate?.country || 'N/A',
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
    const fmt = (n: number) => (n || 0).toFixed(2);

    // Common Header Meta
    lines.push(`TaxPal Financial Report`);
    lines.push(`Report Type,${report.reportType}`);
    lines.push(`Period,${report.period}`);
    lines.push(`Date Range,${report.periodStart.toISOString().split('T')[0]} to ${report.periodEnd.toISOString().split('T')[0]}`);
    lines.push(`Generated Date,${new Date(report.createdAt).toISOString()}`);
    lines.push(``);

    switch (report.reportType) {
      case 'Income Statement': {
        // Summary
        lines.push(`--- Profit & Loss Summary ---`);
        lines.push(`Metric,Amount ($)`);
        lines.push(`Total Revenue,${fmt(report.totalIncome)}`);
        lines.push(`Total Costs,${fmt(report.totalExpenses)}`);
        lines.push(`Net Profit / Loss,${fmt(report.netSavings)}`);
        lines.push(`Profit Margin,${report.data?.savingsRate || 0}%`);
        lines.push(``);

        // Income Sources
        const incomeCats = report.data?.incomeCategoryBreakdown || [];
        if (incomeCats.length > 0) {
          lines.push(`--- Revenue Sources ---`);
          lines.push(`Source,Amount ($),Share (%),Transactions`);
          incomeCats.forEach((cat: any) => {
            lines.push(`"${cat.category}",${fmt(cat.amount)},${cat.percentage}%,${cat.count}`);
          });
          lines.push(``);
        }

        // Monthly P&L
        const monthly = report.data?.monthlyBreakdown || [];
        if (monthly.length > 0) {
          lines.push(`--- Monthly Profit & Loss ---`);
          lines.push(`Month,Revenue ($),Costs ($),Net Profit ($)`);
          monthly.forEach((m) => {
            lines.push(`"${m.month}",${fmt(m.income)},${fmt(m.expenses)},${fmt(m.netSavings)}`);
          });
          lines.push(``);
        }

        // Recent Income Transactions
        const txs = report.data?.recentTransactions || [];
        if (txs.length > 0) {
          lines.push(`--- Recent Income Transactions ---`);
          lines.push(`Date,Description,Category,Amount ($)`);
          txs.forEach((tx: any) => {
            const d = new Date(tx.date).toISOString().split('T')[0];
            lines.push(`"${d}","${(tx.description || '').replace(/"/g, '""')}","${tx.category}",${fmt(tx.amount)}`);
          });
        }
        break;
      }

      case 'Expense Breakdown': {
        // Summary
        lines.push(`--- Spending Summary ---`);
        lines.push(`Metric,Value`);
        lines.push(`Total Spending,${fmt(report.totalExpenses)}`);
        lines.push(`Expense Transactions,${report.data?.transactionCount || 0}`);
        lines.push(`Avg per Transaction,${fmt(report.data?.avgExpensePerTransaction || 0)}`);
        lines.push(`Top Category,${report.data?.topExpenseCategory || 'N/A'}`);
        lines.push(``);

        // Spending by Category
        const cats = report.data?.categoryBreakdown || [];
        if (cats.length > 0) {
          lines.push(`--- Spending by Category ---`);
          lines.push(`Category,Amount ($),Share (%),Transactions`);
          cats.forEach((cat) => {
            lines.push(`"${cat.category}",${fmt(cat.amount)},${cat.percentage}%,${cat.count}`);
          });
          lines.push(``);
        }

        // Monthly Spending
        const monthly = report.data?.monthlyBreakdown || [];
        if (monthly.length > 0) {
          lines.push(`--- Monthly Spending Trend ---`);
          lines.push(`Month,Expenses ($)`);
          monthly.forEach((m) => {
            lines.push(`"${m.month}",${fmt(m.expenses)}`);
          });
          lines.push(``);
        }

        // Recent Expense Transactions
        const txs = report.data?.recentTransactions || [];
        if (txs.length > 0) {
          lines.push(`--- Recent Expense Transactions ---`);
          lines.push(`Date,Description,Category,Amount ($)`);
          txs.forEach((tx: any) => {
            const d = new Date(tx.date).toISOString().split('T')[0];
            lines.push(`"${d}","${(tx.description || '').replace(/"/g, '""')}","${tx.category}",${fmt(tx.amount)}`);
          });
        }
        break;
      }

      case 'Tax Summary': {
        // Tax Overview
        lines.push(`--- Tax Overview ---`);
        lines.push(`Metric,Value`);
        lines.push(`Gross Income,${fmt(report.totalIncome)}`);
        lines.push(`Total Deductions,${fmt(report.data?.totalDeductible || 0)}`);
        lines.push(`Taxable Income,${fmt(report.data?.taxableIncome || 0)}`);
        lines.push(`Effective Tax Rate,${report.data?.effectiveTaxRate || 0}%`);
        lines.push(`Estimated Annual Tax,${fmt(report.data?.estimatedAnnualTax || 0)}`);
        lines.push(`Total Estimated Tax (Period),${fmt(report.data?.totalEstimatedTax || 0)}`);
        lines.push(`Country,${report.data?.country || 'N/A'}`);
        lines.push(``);

        // Deduction Breakdown
        const deductions = report.data?.deductionBreakdown || [];
        if (deductions.length > 0) {
          lines.push(`--- Deductible Expenses ---`);
          lines.push(`Category,Amount ($),Transactions`);
          deductions.forEach((d: any) => {
            lines.push(`"${d.category}",${fmt(d.amount)},${d.count}`);
          });
          lines.push(`"Total Deductions",${fmt(report.data?.totalDeductible || 0)},`);
          lines.push(``);
        }

        // Quarterly Tax Estimates
        const qEstimates = report.data?.quarterlyEstimates || [];
        if (qEstimates.length > 0) {
          lines.push(`--- Quarterly Tax Estimates ---`);
          lines.push(`Quarter,Gross Income ($),Estimated Tax ($),Due Date,Status`);
          qEstimates.forEach((qe: any) => {
            const dueDate = new Date(qe.dueDate).toISOString().split('T')[0];
            lines.push(`"${qe.quarter}",${fmt(qe.grossIncome)},${fmt(qe.estimatedTax)},"${dueDate}","${qe.status}"`);
          });
          lines.push(``);
        }

        // All Expense Categories
        const cats = report.data?.categoryBreakdown || [];
        if (cats.length > 0) {
          lines.push(`--- All Expense Categories ---`);
          lines.push(`Category,Amount ($),Share (%),Transactions`);
          cats.forEach((cat) => {
            lines.push(`"${cat.category}",${fmt(cat.amount)},${cat.percentage}%,${cat.count}`);
          });
        }
        break;
      }

      case 'Income & Expense Summary':
      default: {
        // Summary
        lines.push(`--- Financial Summary ---`);
        lines.push(`Metric,Amount ($)`);
        lines.push(`Total Income,${fmt(report.totalIncome)}`);
        lines.push(`Total Expenses,${fmt(report.totalExpenses)}`);
        lines.push(`Net Savings,${fmt(report.netSavings)}`);
        if (report.data?.savingsRate !== undefined) {
          lines.push(`Savings Rate,${report.data.savingsRate}%`);
        }
        lines.push(``);

        // Income Sources
        const incomeCats = report.data?.incomeCategoryBreakdown || [];
        if (incomeCats.length > 0) {
          lines.push(`--- Income Sources ---`);
          lines.push(`Source,Amount ($),Share (%),Transactions`);
          incomeCats.forEach((cat: any) => {
            lines.push(`"${cat.category}",${fmt(cat.amount)},${cat.percentage}%,${cat.count}`);
          });
          lines.push(``);
        }

        // Expense Category Breakdown
        const cats = report.data?.categoryBreakdown || [];
        if (cats.length > 0) {
          lines.push(`--- Expense Category Breakdown ---`);
          lines.push(`Category,Amount ($),Percentage (%),Transaction Count`);
          cats.forEach((cat) => {
            lines.push(`"${cat.category}",${fmt(cat.amount)},${cat.percentage}%,${cat.count}`);
          });
          lines.push(``);
        }

        // Monthly Breakdown
        const monthly = report.data?.monthlyBreakdown || [];
        if (monthly.length > 0) {
          lines.push(`--- Monthly Breakdown ---`);
          lines.push(`Month,Income ($),Expenses ($),Net Savings ($)`);
          monthly.forEach((m) => {
            lines.push(`"${m.month}",${fmt(m.income)},${fmt(m.expenses)},${fmt(m.netSavings)}`);
          });
          lines.push(``);
        }

        // Transactions
        const txs = report.data?.recentTransactions || [];
        if (txs.length > 0) {
          lines.push(`--- Transactions Included ---`);
          lines.push(`Date,Description,Category,Type,Amount ($)`);
          txs.forEach((tx: any) => {
            const d = new Date(tx.date).toISOString().split('T')[0];
            lines.push(`"${d}","${(tx.description || '').replace(/"/g, '""')}","${tx.category}","${tx.type}",${fmt(tx.amount)}`);
          });
        }
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

      const fmtMoney = (n: number) => '$' + (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

        case 'Income Statement': {
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

        case 'Tax Summary': {
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
