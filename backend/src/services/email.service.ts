import nodemailer, { Transporter } from 'nodemailer';
import { Alert, User } from '@prisma/client';
import { FairValueResult } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('EmailService');

/**
 * EmailService handles sending email notifications
 * Requirements: 6.2
 */
export class EmailService {
  private transporter: Transporter;
  private fromEmail: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@stockmeter.com';
    
    // Configure email transporter based on environment
    if (process.env.SENDGRID_API_KEY) {
      // SendGrid configuration
      this.transporter = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 587,
        secure: false,
        auth: {
          user: 'apikey',
          pass: process.env.SENDGRID_API_KEY,
        },
      });
      logger.info('Email service configured with SendGrid');
    } else if (process.env.AWS_SES_REGION) {
      // AWS SES configuration (requires AWS SDK)
      // For now, using SMTP interface
      this.transporter = nodemailer.createTransport({
        host: `email-smtp.${process.env.AWS_SES_REGION}.amazonaws.com`,
        port: 587,
        secure: false,
        auth: {
          user: process.env.AWS_SES_ACCESS_KEY || '',
          pass: process.env.AWS_SES_SECRET_KEY || '',
        },
      });
      logger.info('Email service configured with AWS SES');
    } else {
      // Development mode - use ethereal email (test account)
      logger.warn('No email provider configured, using test account');
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || 'test@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'test',
        },
      });
    }
  }

  /**
   * Send alert notification email
   * Requirements: 6.2
   */
  async sendAlertNotification(
    user: User,
    alert: Alert,
    stock: FairValueResult,
    reason: string
  ): Promise<void> {
    try {
      const subject = `🔔 Stock Alert: ${alert.ticker} - ${alert.thresholdType}`;
      const html = this.generateAlertEmailTemplate(user, alert, stock, reason);
      const text = this.generateAlertEmailText(user, alert, stock, reason);

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject,
        text,
        html,
      });

      logger.info(`Alert notification sent to ${user.email} for ${alert.ticker}`);
    } catch (error) {
      logger.error(`Failed to send alert notification to ${user.email}:`, error);
      throw error;
    }
  }

  /**
   * Generate HTML email template for alert notification
   */
  private generateAlertEmailTemplate(
    user: User,
    alert: Alert,
    stock: FairValueResult,
    reason: string
  ): string {
    const { ticker, thresholdType, thresholdValue } = alert;
    const { currentPrice, valuationStatus } = stock;

    // Calculate average fair value
    const fairValues: number[] = [];
    if (stock.dcf?.fairValue) fairValues.push(stock.dcf.fairValue);
    if (stock.ddm?.fairValue) fairValues.push(stock.ddm.fairValue);
    if (stock.graham?.fairValue) fairValues.push(stock.graham.fairValue);
    if (stock.relativeValue?.peRatioFairValue) fairValues.push(stock.relativeValue.peRatioFairValue);
    if (stock.relativeValue?.pbRatioFairValue) fairValues.push(stock.relativeValue.pbRatioFairValue);
    if (stock.relativeValue?.psRatioFairValue) fairValues.push(stock.relativeValue.psRatioFairValue);

    const averageFairValue = fairValues.length > 0
      ? fairValues.reduce((sum, val) => sum + val, 0) / fairValues.length
      : 0;

    const statusColor = valuationStatus === 'undervalued' ? '#10b981' : 
                       valuationStatus === 'overvalued' ? '#ef4444' : '#6b7280';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Stock Alert - ${ticker}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h1 style="color: #1f2937; margin-top: 0;">🔔 Stock Alert Triggered</h1>
    <p style="font-size: 16px; color: #4b5563;">Hi ${user.name},</p>
    <p style="font-size: 16px; color: #4b5563;">Your alert for <strong>${ticker}</strong> has been triggered!</p>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">Alert Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Ticker:</td>
        <td style="padding: 8px 0; font-weight: bold;">${ticker}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Alert Type:</td>
        <td style="padding: 8px 0; font-weight: bold; text-transform: capitalize;">${thresholdType}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Threshold:</td>
        <td style="padding: 8px 0; font-weight: bold;">${thresholdValue}%</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Current Status:</td>
        <td style="padding: 8px 0;">
          <span style="background-color: ${statusColor}; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px; text-transform: capitalize;">
            ${valuationStatus.replace('_', ' ')}
          </span>
        </td>
      </tr>
    </table>
  </div>

  <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
    <h2 style="color: #1f2937; margin-top: 0;">Stock Valuation</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Current Price:</td>
        <td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #1f2937;">$${currentPrice.toFixed(2)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Average Fair Value:</td>
        <td style="padding: 8px 0; font-weight: bold; font-size: 18px; color: #1f2937;">$${averageFairValue.toFixed(2)}</td>
      </tr>
      ${stock.dcf?.fairValue ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">DCF Fair Value:</td>
        <td style="padding: 8px 0;">$${stock.dcf.fairValue.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${stock.ddm?.fairValue ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">DDM Fair Value:</td>
        <td style="padding: 8px 0;">$${stock.ddm.fairValue.toFixed(2)}</td>
      </tr>
      ` : ''}
      ${stock.graham?.fairValue ? `
      <tr>
        <td style="padding: 8px 0; color: #6b7280;">Graham Number:</td>
        <td style="padding: 8px 0;">$${stock.graham.fairValue.toFixed(2)}</td>
      </tr>
      ` : ''}
    </table>
  </div>

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
    <p style="margin: 0; color: #4b5563; font-size: 14px;">
      <strong>Reason:</strong> ${reason}
    </p>
  </div>

  <div style="text-align: center; margin-top: 30px;">
    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/stocks/${ticker}" 
       style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
      View Full Analysis
    </a>
  </div>

  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
    <p>This is an automated alert from Stockmeter.</p>
    <p>To manage your alerts, visit your <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/alerts" style="color: #3b82f6;">alerts page</a>.</p>
    <p>&copy; ${new Date().getFullYear()} Stockmeter. All rights reserved.</p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Generate plain text email for alert notification
   */
  private generateAlertEmailText(
    user: User,
    alert: Alert,
    stock: FairValueResult,
    reason: string
  ): string {
    const { ticker, thresholdType, thresholdValue } = alert;
    const { currentPrice, valuationStatus } = stock;

    // Calculate average fair value
    const fairValues: number[] = [];
    if (stock.dcf?.fairValue) fairValues.push(stock.dcf.fairValue);
    if (stock.ddm?.fairValue) fairValues.push(stock.ddm.fairValue);
    if (stock.graham?.fairValue) fairValues.push(stock.graham.fairValue);
    if (stock.relativeValue?.peRatioFairValue) fairValues.push(stock.relativeValue.peRatioFairValue);
    if (stock.relativeValue?.pbRatioFairValue) fairValues.push(stock.relativeValue.pbRatioFairValue);
    if (stock.relativeValue?.psRatioFairValue) fairValues.push(stock.relativeValue.psRatioFairValue);

    const averageFairValue = fairValues.length > 0
      ? fairValues.reduce((sum, val) => sum + val, 0) / fairValues.length
      : 0;

    return `
Stock Alert Triggered

Hi ${user.name},

Your alert for ${ticker} has been triggered!

Alert Details:
- Ticker: ${ticker}
- Alert Type: ${thresholdType}
- Threshold: ${thresholdValue}%
- Current Status: ${valuationStatus.replace('_', ' ')}

Stock Valuation:
- Current Price: $${currentPrice.toFixed(2)}
- Average Fair Value: $${averageFairValue.toFixed(2)}
${stock.dcf?.fairValue ? `- DCF Fair Value: $${stock.dcf.fairValue.toFixed(2)}` : ''}
${stock.ddm?.fairValue ? `- DDM Fair Value: $${stock.ddm.fairValue.toFixed(2)}` : ''}
${stock.graham?.fairValue ? `- Graham Number: $${stock.graham.fairValue.toFixed(2)}` : ''}

Reason: ${reason}

View full analysis: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/stocks/${ticker}

To manage your alerts, visit: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/alerts

---
This is an automated alert from Stockmeter.
© ${new Date().getFullYear()} Stockmeter. All rights reserved.
    `.trim();
  }

  /**
   * Verify email configuration
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed:', error);
      return false;
    }
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
};
