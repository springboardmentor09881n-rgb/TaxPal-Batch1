import { Request, Response } from 'express';
import { Chat } from '../models/Chat';
import { Anomaly } from '../models/Anomaly';

export const deleteAIData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // 1. Delete Chat History
    const chatResult = await Chat.deleteMany({ user: userId });

    // 2. Delete Anomaly Data (since it is AI/smart generated)
    const anomalyResult = await Anomaly.deleteMany({ userId });

    // Note: We do NOT delete Transaction, Budget, or TaxEstimate data.
    // We also do not delete documents as they are only processed in memory, not permanently stored.

    res.status(200).json({
      success: true,
      message: 'Permanent AI Data Deletion successful.',
      details: {
        chatsDeleted: chatResult.deletedCount,
        anomaliesDeleted: anomalyResult.deletedCount,
      }
    });

  } catch (error: any) {
    console.error('AI Data Deletion Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
};
