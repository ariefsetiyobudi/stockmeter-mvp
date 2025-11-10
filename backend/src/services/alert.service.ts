import { PrismaClient, Alert } from '@prisma/client';
import { ValuationService } from './valuation.service';
import { ProviderManager } from '../adapters';
import { FairValueResult } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('AlertService');
const prisma = new PrismaClient();

export interface TriggeredAlert {
  alert: Alert;
  stock: FairValueResult;
  reason: string;
}

/**
 * AlertService monitors stocks and identifies triggered alerts
 * Requirements: 6.2, 6.3
 */
export class AlertService {
  private valuationService: ValuationService;

  constructor(providerManager: ProviderManager) {
    this.valuationService = new ValuationService(providerManager);
  }

  /**
   * Check all active alerts and identify triggered ones
   * Requirements: 6.2, 6.3
   */
  async checkAlerts(): Promise<TriggeredAlert[]> {
    try {
      logger.info('Starting alert check');

      // Fetch all active alerts
      const activeAlerts = await prisma.alert.findMany({
        where: {
          status: 'active',
        },
        include: {
          user: true,
        },
      });

      if (activeAlerts.length === 0) {
        logger.info('No active alerts to check');
        return [];
      }

      logger.info(`Checking ${activeAlerts.length} active alerts`);

      // Get unique tickers from alerts
      const uniqueTickers = [...new Set(activeAlerts.map(alert => alert.ticker))];
      logger.info(`Fetching fair values for ${uniqueTickers.length} unique tickers`);

      // Fetch fair values for all watched stocks
      const fairValueResults = new Map<string, FairValueResult>();
      
      for (const ticker of uniqueTickers) {
        try {
          const fairValue = await this.valuationService.calculateAllModels(ticker);
          fairValueResults.set(ticker, fairValue);
          logger.info(`Calculated fair value for ${ticker}: ${fairValue.valuationStatus}`);
        } catch (error) {
          logger.error(`Failed to calculate fair value for ${ticker}:`, error);
          // Continue with other tickers
        }
      }

      // Compare against threshold conditions
      const triggeredAlerts: TriggeredAlert[] = [];

      for (const alert of activeAlerts) {
        const fairValue = fairValueResults.get(alert.ticker);
        
        if (!fairValue) {
          logger.warn(`No fair value data for ${alert.ticker}, skipping alert ${alert.id}`);
          continue;
        }

        const isTriggered = this.evaluateAlertCondition(alert, fairValue);
        
        if (isTriggered) {
          const reason = this.getAlertReason(alert, fairValue);
          triggeredAlerts.push({
            alert,
            stock: fairValue,
            reason,
          });
          logger.info(`Alert triggered: ${alert.id} for ${alert.ticker} - ${reason}`);
        }
      }

      logger.info(`Found ${triggeredAlerts.length} triggered alerts`);
      return triggeredAlerts;
    } catch (error) {
      logger.error('Error checking alerts:', error);
      throw error;
    }
  }

  /**
   * Evaluate if an alert condition is met
   */
  private evaluateAlertCondition(alert: Alert, fairValue: FairValueResult): boolean {
    const { thresholdType, thresholdValue } = alert;
    const { valuationStatus, currentPrice } = fairValue;

    // Calculate average fair value from available models
    const fairValues: number[] = [];
    
    if (fairValue.dcf?.fairValue) fairValues.push(fairValue.dcf.fairValue);
    if (fairValue.ddm?.fairValue) fairValues.push(fairValue.ddm.fairValue);
    if (fairValue.graham?.fairValue) fairValues.push(fairValue.graham.fairValue);
    if (fairValue.relativeValue?.peRatioFairValue) fairValues.push(fairValue.relativeValue.peRatioFairValue);
    if (fairValue.relativeValue?.pbRatioFairValue) fairValues.push(fairValue.relativeValue.pbRatioFairValue);
    if (fairValue.relativeValue?.psRatioFairValue) fairValues.push(fairValue.relativeValue.psRatioFairValue);

    if (fairValues.length === 0) {
      return false;
    }

    const averageFairValue = fairValues.reduce((sum, val) => sum + val, 0) / fairValues.length;
    const discountPercent = ((averageFairValue - currentPrice) / averageFairValue) * 100;

    // Check threshold conditions
    switch (thresholdType) {
      case 'undervalued':
        // Alert if stock is undervalued by at least thresholdValue percent
        return valuationStatus === 'undervalued' && discountPercent >= thresholdValue;
      
      case 'overvalued':
        // Alert if stock is overvalued by at least thresholdValue percent
        return valuationStatus === 'overvalued' && Math.abs(discountPercent) >= thresholdValue;
      
      case 'fair':
        // Alert if stock is fairly priced (within thresholdValue percent)
        return valuationStatus === 'fairly_priced' && Math.abs(discountPercent) <= thresholdValue;
      
      default:
        return false;
    }
  }

  /**
   * Generate human-readable reason for alert trigger
   */
  private getAlertReason(alert: Alert, fairValue: FairValueResult): string {
    const { thresholdType, thresholdValue, ticker } = alert;
    const { currentPrice, valuationStatus } = fairValue;

    // Calculate average fair value
    const fairValues: number[] = [];
    
    if (fairValue.dcf?.fairValue) fairValues.push(fairValue.dcf.fairValue);
    if (fairValue.ddm?.fairValue) fairValues.push(fairValue.ddm.fairValue);
    if (fairValue.graham?.fairValue) fairValues.push(fairValue.graham.fairValue);
    if (fairValue.relativeValue?.peRatioFairValue) fairValues.push(fairValue.relativeValue.peRatioFairValue);
    if (fairValue.relativeValue?.pbRatioFairValue) fairValues.push(fairValue.relativeValue.pbRatioFairValue);
    if (fairValue.relativeValue?.psRatioFairValue) fairValues.push(fairValue.relativeValue.psRatioFairValue);

    const averageFairValue = fairValues.reduce((sum, val) => sum + val, 0) / fairValues.length;
    const discountPercent = ((averageFairValue - currentPrice) / averageFairValue) * 100;

    switch (thresholdType) {
      case 'undervalued':
        return `${ticker} is ${valuationStatus} by ${discountPercent.toFixed(1)}% (threshold: ${thresholdValue}%). Current price: $${currentPrice.toFixed(2)}, Average fair value: $${averageFairValue.toFixed(2)}`;
      
      case 'overvalued':
        return `${ticker} is ${valuationStatus} by ${Math.abs(discountPercent).toFixed(1)}% (threshold: ${thresholdValue}%). Current price: $${currentPrice.toFixed(2)}, Average fair value: $${averageFairValue.toFixed(2)}`;
      
      case 'fair':
        return `${ticker} is ${valuationStatus} within ${Math.abs(discountPercent).toFixed(1)}% of fair value (threshold: ${thresholdValue}%). Current price: $${currentPrice.toFixed(2)}, Average fair value: $${averageFairValue.toFixed(2)}`;
      
      default:
        return `${ticker} alert triggered`;
    }
  }
}
