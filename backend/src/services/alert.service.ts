import { Alert, IAlertDocument } from '../models/Alert';
import { ApiError } from '../utils/ApiError';

export interface ICreateAlertDTO {
  type: string;
  message: string;
  alertDate: Date | string;
  isRead?: boolean;
}

export class AlertService {
  /**
   * Create a new alert manually
   */
  public static async createAlert(
    userId: string,
    data: ICreateAlertDTO
  ): Promise<IAlertDocument> {
    const alert = new Alert({
      userId,
      type: data.type,
      message: data.message,
      alertDate: new Date(data.alertDate),
      isRead: data.isRead ?? false,
    });

    return await alert.save();
  }

  /**
   * Automatically generate a quarterly tax reminder alert upon tax estimate creation
   */
  public static async createTaxReminderAlert(
    userId: string,
    quarter: string,
    dueDate: Date
  ): Promise<IAlertDocument> {
    const formattedDate = new Date(dueDate).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });

    const message = `Your ${quarter} advance tax payment is due on ${formattedDate}.`;

    const alert = new Alert({
      userId,
      type: 'Quarterly Tax Reminder',
      message,
      alertDate: dueDate,
      isRead: false,
    });

    return await alert.save();
  }

  /**
   * Get all alerts of logged-in user sorted by alertDate (latest first)
   */
  public static async getAlerts(
    userId: string,
    isRead?: boolean
  ): Promise<IAlertDocument[]> {
    const filter: Record<string, any> = { userId };
    if (isRead !== undefined) {
      filter.isRead = isRead;
    }

    return await Alert.find(filter).sort({ alertDate: -1, createdAt: -1 });
  }

  /**
   * Get a single alert by ID for logged-in user
   */
  public static async getAlertById(
    userId: string,
    alertId: string
  ): Promise<IAlertDocument> {
    const alert = await Alert.findOne({ _id: alertId, userId });
    if (!alert) {
      throw new ApiError(404, 'Alert not found');
    }
    return alert;
  }

  /**
   * Mark alert as read (PUT /api/alerts/:id/read)
   */
  public static async markAsRead(
    userId: string,
    alertId: string
  ): Promise<IAlertDocument> {
    const alert = await Alert.findOne({ _id: alertId, userId });
    if (!alert) {
      throw new ApiError(404, 'Alert not found');
    }

    alert.isRead = true;
    return await alert.save();
  }

  /**
   * Delete alert by ID
   */
  public static async deleteAlert(
    userId: string,
    alertId: string
  ): Promise<void> {
    const alert = await Alert.findOneAndDelete({ _id: alertId, userId });
    if (!alert) {
      throw new ApiError(404, 'Alert not found');
    }
  }
}
