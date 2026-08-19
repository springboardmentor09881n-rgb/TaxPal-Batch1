import { ScheduledReport, IScheduledReport } from '../models/ScheduledReport';
import { ReportService } from './report.service';
import { MailerService } from './mailer.service';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';

export class ScheduleService {
  /**
   * Create a scheduled report
   */
  public static async createSchedule(userId: string, data: any): Promise<IScheduledReport> {
    const { email, reportType, format } = data;

    if (!email || !reportType) {
      throw new ApiError(400, 'Email address and report type are required');
    }

    const scheduled = new ScheduledReport({
      userId,
      email,
      reportType,
      format: format || 'PDF',
      status: 'active'
    });

    return await scheduled.save();
  }

  /**
   * Get all scheduled reports for a user
   */
  public static async getSchedules(userId: string): Promise<IScheduledReport[]> {
    return await ScheduledReport.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Delete a scheduled report
   */
  public static async deleteSchedule(userId: string, scheduleId: string): Promise<void> {
    const result = await ScheduledReport.deleteOne({ _id: scheduleId, userId });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Scheduled report not found');
    }
  }

  /**
   * Run background task to check and dispatch scheduled reports
   */
  public static async runScheduledTask(): Promise<void> {
    console.log('[SCHEDULE WORKER] Starting scheduled reports heartbeat scan...');
    try {
      const activeSchedules = await ScheduledReport.find({ status: 'active' });
      console.log(`[SCHEDULE WORKER] Found ${activeSchedules.length} active scheduled reports`);

      for (const schedule of activeSchedules) {
        const shouldSend = !schedule.lastSent || 
          (Date.now() - new Date(schedule.lastSent).getTime()) >= 28 * 24 * 60 * 60 * 1000;

        if (shouldSend) {
          console.log(`[SCHEDULE WORKER] Sending report to ${schedule.email} (Type: ${schedule.reportType}, Format: ${schedule.format})`);
          try {
            // Retrieve User Details
            const user = await User.findById(schedule.userId);
            if (!user) {
              console.warn(`[SCHEDULE WORKER] User not found for schedule: ${schedule._id}, skipping`);
              continue;
            }

            const userName = user.fullName || 'Freelancer';

            // Generate report data for "Last Month"
            const report = await ReportService.generateReport(schedule.userId.toString(), {
              reportType: schedule.reportType,
              period: 'Last Month',
              format: schedule.format
            });

            // Generate report file buffers
            let fileBuffer: Buffer;
            let filename: string;
            let mimeType: string;

            const safePeriod = 'Last_Month';
            const safeType = (schedule.reportType || 'Summary').replace(/[^a-zA-Z0-9_-]/g, '_');

            if (schedule.format === 'CSV') {
              fileBuffer = ReportService.generateCSV(report);
              filename = `TaxPal_${safeType}_${safePeriod}.csv`;
              mimeType = 'text/csv';
            } else {
              fileBuffer = await ReportService.generatePDF(report, userName);
              filename = `TaxPal_${safeType}_${safePeriod}.pdf`;
              mimeType = 'application/pdf';
            }

            // Email report
            const mailSent = await MailerService.sendReportMail(
              schedule.email,
              schedule.reportType,
              'Last Month',
              fileBuffer,
              filename,
              mimeType
            );

            if (mailSent) {
              schedule.lastSent = new Date();
              await schedule.save();
              console.log(`[SCHEDULE WORKER] Successfully sent scheduled report ${schedule._id} to ${schedule.email}`);
            } else {
              console.error(`[SCHEDULE WORKER] Failed to email scheduled report ${schedule._id}`);
            }
          } catch (itemError) {
            console.error(`[SCHEDULE WORKER] Error processing schedule ${schedule._id}:`, itemError);
          }
        }
      }
    } catch (error) {
      console.error('[SCHEDULE WORKER] Heartbeat error during scanning:', error);
    }
  }
}
