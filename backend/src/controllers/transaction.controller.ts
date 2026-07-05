import { Request, Response, NextFunction } from 'express';
import { TransactionService } from '../services/transaction.service';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';

export class TransactionController {
  /**
   * Create transaction handler
   */
  public static async createTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const transaction = await TransactionService.createTransaction(userId, req.body);
      res.status(201).json(new ApiResponse(transaction, 'Transaction created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all user transactions handler
   */
  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const transactions = await TransactionService.getTransactions(userId);
      res.status(200).json(new ApiResponse(transactions, 'Transactions retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single transaction handler
   */
  public static async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: transactionId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const transaction = await TransactionService.getTransactionById(userId, transactionId);
      res.status(200).json(new ApiResponse(transaction, 'Transaction retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update transaction handler
   */
  public static async updateTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: transactionId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      const transaction = await TransactionService.updateTransaction(userId, transactionId, req.body);
      res.status(200).json(new ApiResponse(transaction, 'Transaction updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete transaction handler
   */
  public static async deleteTransaction(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id: transactionId } = req.params;

      if (!userId) {
        throw new ApiError(401, 'Unauthorized: User context missing');
      }

      await TransactionService.deleteTransaction(userId, transactionId);
      res.status(200).json(new ApiResponse(null, 'Transaction deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}
