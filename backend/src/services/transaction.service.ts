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
  public static async getTransactionById(userId: string, transactionId: string): Promise<ITransactionDocument> {
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
    data: any
  ): Promise<ITransactionDocument> {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: transactionId, userId },
      { $set: data },
      { new: true, runValidators: true }
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
}
