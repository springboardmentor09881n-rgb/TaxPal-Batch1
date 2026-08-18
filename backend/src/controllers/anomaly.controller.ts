import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction';
import { Anomaly } from '../models/Anomaly';

export const scanAnomalies = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // 1. Fetch user's transactions
    const transactions = await Transaction.find({ userId }).sort({ transactionDate: 1 });

    if (!transactions || transactions.length === 0) {
      res.status(200).json({ success: true, message: 'No transactions found to scan.', anomalies: [] });
      return;
    }

    // Clear previous anomalies generated for this scan to avoid duplicates
    // (Assuming each scan is a fresh analysis. In a real app, you might only scan un-scanned transactions)
    await Anomaly.deleteMany({ userId });

    const newAnomalies: any[] = [];
    const categoryStats: Record<string, { total: number; count: number; avg: number }> = {};
    const seenTransactions = new Map<string, number>();

    // Pass 1: Calculate averages and track potential exact duplicates
    transactions.forEach((t) => {
      // Stats for Category averages
      if (!categoryStats[t.category]) {
        categoryStats[t.category] = { total: 0, count: 0, avg: 0 };
      }
      categoryStats[t.category].total += t.amount;
      categoryStats[t.category].count += 1;

      // Duplicate Check key: Date (YYYY-MM-DD) + Amount + Category
      const dateStr = t.transactionDate.toISOString().split('T')[0];
      const dupKey = `${dateStr}-${t.amount}-${t.category}`;
      seenTransactions.set(dupKey, (seenTransactions.get(dupKey) || 0) + 1);
    });

    // Calculate averages
    Object.keys(categoryStats).forEach((cat) => {
      categoryStats[cat].avg = categoryStats[cat].total / categoryStats[cat].count;
    });

    // Pass 2: Detect Anomalies
    transactions.forEach((t) => {
      // Check 1: Unusually High Expense (amount > 3x the category average, and amount > 50 to ignore micro-transactions)
      const catAvg = categoryStats[t.category].avg;
      if (t.amount > 50 && t.amount > catAvg * 3 && categoryStats[t.category].count > 3) {
        newAnomalies.push({
          userId,
          transactionId: t._id,
          type: 'High Expense',
          severity: 'Medium',
          explanation: `Unusual activity detected: This transaction amount ($${t.amount}) is significantly higher than your average spending in the '${t.category}' category ($${catAvg.toFixed(2)}).`,
        });
      }

      // Check 2: Exact Duplicate Check
      const dateStr = t.transactionDate.toISOString().split('T')[0];
      const dupKey = `${dateStr}-${t.amount}-${t.category}`;
      if (seenTransactions.get(dupKey)! > 1) {
        newAnomalies.push({
          userId,
          transactionId: t._id,
          type: 'Potential Duplicate',
          severity: 'Low',
          explanation: `Unusual activity detected: We found multiple transactions for $${t.amount} in '${t.category}' on ${dateStr}. Please verify if this was charged twice.`,
        });
        // Remove from map to avoid flagging the same duplicate group multiple times
        seenTransactions.set(dupKey, 0);
      }
    });

    // Save anomalies to database
    if (newAnomalies.length > 0) {
      await Anomaly.insertMany(newAnomalies);
    }

    const savedAnomalies = await Anomaly.find({ userId }).sort({ detectedAt: -1 }).populate('transactionId');

    res.status(200).json({
      success: true,
      message: `Scanned ${transactions.length} transactions. Found ${newAnomalies.length} anomalies.`,
      anomalies: savedAnomalies,
    });
  } catch (error: any) {
    console.error('Anomaly Scan Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};

export const getAnomalies = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const anomalies = await Anomaly.find({ userId }).sort({ detectedAt: -1 }).populate('transactionId');
    res.status(200).json({ success: true, anomalies });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
