import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { AlertService } from './alert.service';
import { EmailService, getEmailService } from './email.service';
import { ProviderManager } from '../adapters';
import { createLogger } from '../utils/logger';

const logger = createLogger('AlertScheduler');
const prisma = new PrismaClient();

/**
 * AlertScheduler runs periodic checks for triggered alerts
 * Requirements: 6.3
 */
export class AlertScheduler {
  private alertService: AlertService;
  private emailService: EmailService;
  private cronJob: cron.ScheduledTask | null = null;

  constructor(providerManager: ProviderManager) {
    this.alertService = new AlertService(providerManager);
    this.emailService = getEmailService();
  }

  /**
   * Start the scheduled alert checker
   * Runs every 24 hours at midnight
   * Requirements: 6.3
   */
  start(): void {
    if (this.cronJob) {
      logger.warn('Alert scheduler is already running');
      return;
    }

    // Schedule to run every day at midnight (00:00)
    // Cron format: second minute hour day month weekday
    // '0 0 * * *' = At 00:00 every day
    this.cronJob = cron.schedule('0 0 * * *', async () => {
      await this.checkAndNotify();
    });

    logger.info('Alert scheduler started - will run daily at midnight');
  }

  /**
   * Stop the scheduled alert checker
   */
  stop(): void {
    if (this.cronJob) {
      this.cronJob.stop();
      this.cronJob = null;
      logger.info('Alert scheduler stopped');
    }
  }

  /**
   * Manually trigger alert check (for testing or manual runs)
   */
  async runNow(): Promise<void> {
    logger.info('Manual alert check triggered');
    await this.checkAndNotify();
  }

  /**
   * Check alerts and send notifications
   * Requirements: 6.3
   */
  private async checkAndNotify(): Promise<void> {
    try {
      logger.info('Starting scheduled alert check');
      const startTime = Date.now();

      // Check all alerts
      const triggeredAlerts = await this.alertService.checkAlerts();

      if (triggeredAlerts.length === 0) {
        logger.info('No alerts triggered');
        return;
      }

      logger.info(`Processing ${triggeredAlerts.length} triggered alerts`);

      // Send notifications for triggered alerts
      let successCount = 0;
      let failureCount = 0;

      for (const { alert, stock, reason } of triggeredAlerts) {
        try {
          // Get user details
          const user = await prisma.user.findUnique({
            where: { id: alert.userId },
          });

          if (!user) {
            logger.error(`User not found for alert ${alert.id}`);
            failureCount++;
            continue;
          }

          // Send email notification
          await this.emailService.sendAlertNotification(user, alert, stock, reason);

          // Log notification history
          await this.logNotification(alert.id, user.id, stock.ticker, 'sent', reason);

          successCount++;
          logger.info(`Notification sent for alert ${alert.id} (${stock.ticker})`);
        } catch (error) {
          logger.error(`Failed to send notification for alert ${alert.id}:`, error);
          
          // Log failed notification
          await this.logNotification(
            alert.id,
            alert.userId,
            stock.ticker,
            'failed',
            `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
          );

          failureCount++;
        }
      }

      const duration = Date.now() - startTime;
      logger.info(
        `Alert check completed in ${duration}ms - ` +
        `${successCount} notifications sent, ${failureCount} failed`
      );
    } catch (error) {
      logger.error('Error during scheduled alert check:', error);
    }
  }

  /**
   * Log notification history to database
   * Requirements: 6.3
   */
  private async logNotification(
    alertId: string,
    userId: string,
    ticker: string,
    status: 'sent' | 'failed',
    details: string
  ): Promise<void> {
    try {
      // Create a notification log entry
      // Note: This requires a NotificationLog model in Prisma schema
      // For now, we'll just log to console and could add to database later
      logger.info(`Notification log: Alert ${alertId}, User ${userId}, Ticker ${ticker}, Status ${status}`);
      logger.debug(`Notification details: ${details}`);

      // TODO: Add to database when NotificationLog model is added to schema
      // await prisma.notificationLog.create({
      //   data: {
      //     alertId,
      //     userId,
      //     ticker,
      //     status,
      //     details,
      //     sentAt: new Date(),
      //   },
      // });
    } catch (error) {
      logger.error('Failed to log notification:', error);
    }
  }
}

// Singleton instance
let alertSchedulerInstance: AlertScheduler | null = null;

/**
 * Get or create the alert scheduler instance
 */
export const getAlertScheduler = (providerManager: ProviderManager): AlertScheduler => {
  if (!alertSchedulerInstance) {
    alertSchedulerInstance = new AlertScheduler(providerManager);
  }
  return alertSchedulerInstance;
};

/**
 * Initialize and start the alert scheduler
 */
export const initializeAlertScheduler = (providerManager: ProviderManager): void => {
  const scheduler = getAlertScheduler(providerManager);
  scheduler.start();
  logger.info('Alert scheduler initialized');
};
