import mongoose from 'mongoose';
import { Transaction, ITransactionDocument } from '../models/Transaction';
import { ApiError } from '../utils/ApiError';

export class TransactionService {
  /**
   * Create a new transaction for a user
   */
  public static async createTransaction(userId: string, data: any): Promise<ITransactionDocument> {
    const transaction = new Transaction({
      userId,
      ...data,
    });
    return await transaction.save();
  }

  /**
   * Get all transactions for a user
   */
  public static async getTransactions(userId: string): Promise<ITransactionDocument[]> {
    return await Transaction.find({ userId }).sort({ transactionDate: -1 });
  }

  /**
   * Get a single transaction by ID and verify user ownership
   */
  public static async getTransactionById(
    userId: string,
    transactionId: string,
  ): Promise<ITransactionDocument> {
    const transaction = await Transaction.findOne({ _id: transactionId, userId });
    if (!transaction) {
      throw new ApiError(404, 'Transaction not found or unauthorized');
    }
    return transaction;
  }

  /**
   * Update a transaction by ID and verify user ownership
   */
  public static async updateTransaction(
    userId: string,
    transactionId: string,
    data: any,
  ): Promise<ITransactionDocument> {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, userId },
      { $set: data },
      { new: true, runValidators: true },
    );
    if (!transaction) {
      throw new ApiError(404, 'Transaction not found or unauthorized');
    }
    return transaction;
  }

  /**
   * Delete a transaction by ID and verify user ownership
   */
  public static async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    const result = await Transaction.findOneAndDelete({ _id: transactionId, userId });
    if (!result) {
      throw new ApiError(404, 'Transaction not found or unauthorized');
    }
  }

  /**
   * Get total spending grouped by category for a user
   */
  public static async getCategorySummary(
    userId: string,
  ): Promise<{ category: string; amount: number }[]> {
    const summary = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'Expense',
        },
      },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          category: '$_id',
          amount: 1,
        },
      },
      {
        $sort: { amount: -1 },
      },
    ]);
    return summary;
  }

  /**
   * Get chart data (monthly income vs expense stats) for the last 6 months
   */
  public static async getChartData(
    userId: string,
  ): Promise<{ month: string; income: number; expense: number }[]> {
    const today = new Date();
    const sixMonthsAgo = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 5, 1));

    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          transactionDate: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            type: '$type',
          },
          total: { $sum: '$amount' },
        },
      },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          type: '$_id.type',
          total: 1,
        },
      },
    ]);

    const result: { month: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1));
      const year = date.getUTCFullYear();
      const monthNum = date.getUTCMonth() + 1;
      const monthStr = `${year}-${monthNum.toString().padStart(2, '0')}`;

      const monthStats = stats.filter((s) => s.year === year && s.month === monthNum);
      const incomeStat = monthStats.find((s) => s.type === 'Income');
      const expenseStat = monthStats.find((s) => s.type === 'Expense');

      result.push({
        month: monthStr,
        income: incomeStat ? incomeStat.total : 0,
        expense: expenseStat ? expenseStat.total : 0,
      });
    }

    return result;
  }
}
