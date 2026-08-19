import nodemailer from 'nodemailer';

export class MailerService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || 'taxpal.app@gmail.com';
    const pass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : undefined;

    if (pass) {
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass
        }
      });
    }

    // Return a simulated logger dispatcher if credentials are not configured
    return {
      sendMail: async (options: nodemailer.SendMailOptions) => {
        console.log('=== [EMAIL SIMULATOR] ===');
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.text || options.html}`);
        if (options.attachments) {
          console.log(`Attachments count: ${options.attachments.length}`);
          options.attachments.forEach((a: any) => {
            console.log(` - File: ${a.filename} (${a.content ? a.content.length : 0} bytes)`);
          });
        }
        console.log('=========================');
        return { messageId: 'simulated-id-' + Date.now() };
      }
    } as any;
  }

  public static async sendReportMail(
    to: string,
    reportName: string,
    period: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const sender = process.env.SMTP_USER || 'taxpal.app@gmail.com';
      await transporter.sendMail({
        from: `"TaxPal Reports" <${sender}>`,
        to,
        subject: `TaxPal Financial Report: ${reportName} - ${period}`,
        text: `Hello,\n\nPlease find attached your generated TaxPal report: "${reportName}" for the period: ${period}.\n\nBest regards,\nTaxPal team`,
        html: `<p>Hello,</p><p>Please find attached your generated TaxPal report: <strong>"${reportName}"</strong> for the period: <strong>${period}</strong>.</p><br/><p>Best regards,<br/>TaxPal team</p>`,
        attachments: [
          {
            filename: fileName,
            content: fileBuffer,
            contentType: mimeType
          }
        ]
      });
      return true;
    } catch (error) {
      console.error('Failed to send report email:', error);
      return false;
    }
  }

  public static async sendOtpMail(to: string, otp: string): Promise<boolean> {
    try {
      const transporter = this.getTransporter();
      const sender = process.env.SMTP_USER || 'taxpal.app@gmail.com';
      await transporter.sendMail({
        from: `"TaxPal Security" <${sender}>`,
        to,
        subject: 'TaxPal Password Reset OTP',
        text: `Hello,\n\nYour OTP for resetting your password is: ${otp}. It is valid for 15 minutes.\n\nBest regards,\nTaxPal team`,
        html: `<p>Hello,</p><p>Your OTP for resetting your password is: <strong style="font-size: 18px; color: #6366f1; letter-spacing: 2px;">${otp}</strong>.</p><p>It is valid for 15 minutes.</p><br/><p>Best regards,<br/>TaxPal team</p>`
      });
      return true;
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      return false;
    }
  }
}
