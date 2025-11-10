import { Router, Request, Response } from 'express';
import { stripeClient, stripeConfig } from '../config/payment.config';
import { paymentService } from '../services';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import Stripe from 'stripe';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/payments/webhook/stripe
 * Handle Stripe webhook events
 */
router.post(
  '/webhook/stripe',
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripeClient.webhooks.constructEvent(
        req.body,
        sig,
        stripeConfig.webhookSecret
      );
    } catch (err: any) {
      logger.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).json({
        error: {
          code: 'WEBHOOK_SIGNATURE_INVALID',
          message: 'Webhook signature verification failed',
        },
      });
    }

    try {
      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          const userId = session.metadata?.userId;
          const planType = session.metadata?.planType as 'monthly' | 'yearly';

          if (!userId || !planType) {
            logger.error('Missing metadata in Stripe session:', session.id);
            break;
          }

          // Calculate expiry date
          const expiryDate = paymentService.calculateExpiryDate(planType);

          // Update user subscription
          await prisma.user.update({
            where: { id: userId },
            data: {
              subscriptionStatus: 'pro',
              subscriptionExpiry: expiryDate,
            },
          });

          // Create transaction record
          await prisma.transaction.create({
            data: {
              userId,
              provider: 'stripe',
              plan: planType,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              currency: session.currency?.toUpperCase() || 'USD',
              status: 'completed',
              externalId: session.id,
            },
          });

          logger.info(`Stripe subscription activated for user ${userId}`);
          break;
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          // Handle subscription cancellation
          logger.info(`Stripe subscription cancelled: ${subscription.id}`);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          logger.warn(`Stripe payment failed for invoice: ${invoice.id}`);
          break;
        }

        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      return res.json({ received: true });
    } catch (error: any) {
      logger.error('Stripe webhook processing error:', error);
      return res.status(500).json({
        error: {
          code: 'WEBHOOK_PROCESSING_ERROR',
          message: 'Failed to process webhook',
        },
      });
    }
  }
);

/**
 * POST /api/payments/webhook/paypal
 * Handle PayPal webhook events
 */
router.post('/webhook/paypal', async (req: Request, res: Response) => {
  try {
    const webhookEvent = req.body;

    // Verify webhook (simplified - in production, verify signature properly)
    logger.info('PayPal webhook received:', webhookEvent.event_type);

    switch (webhookEvent.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        const resource = webhookEvent.resource;
        const userId = resource.custom_id;

        if (!userId) {
          logger.error('Missing custom_id in PayPal webhook');
          break;
        }

        // Determine plan type from amount (simplified)
        const amount = parseFloat(resource.amount.value);
        const planType = amount > 50 ? 'yearly' : 'monthly';

        // Calculate expiry date
        const expiryDate = paymentService.calculateExpiryDate(planType);

        // Update user subscription
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'pro',
            subscriptionExpiry: expiryDate,
          },
        });

        // Create transaction record
        await prisma.transaction.create({
          data: {
            userId,
            provider: 'paypal',
            plan: planType,
            amount,
            currency: resource.amount.currency_code,
            status: 'completed',
            externalId: resource.id,
          },
        });

        logger.info(`PayPal subscription activated for user ${userId}`);
        break;
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        logger.warn(`PayPal payment issue: ${webhookEvent.event_type}`);
        break;
      }

      default:
        logger.info(`Unhandled PayPal event type: ${webhookEvent.event_type}`);
    }

    return res.json({ received: true });
  } catch (error: any) {
    logger.error('PayPal webhook processing error:', error);
    return res.status(500).json({
      error: {
        code: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Failed to process webhook',
      },
    });
  }
});

/**
 * POST /api/payments/webhook/midtrans
 * Handle Midtrans webhook notifications
 */
router.post('/webhook/midtrans', async (req: Request, res: Response) => {
  try {
    const notification = req.body;

    // Verify signature
    const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
    const signatureKey = notification.signature_key;
    const orderId = notification.order_id;
    const statusCode = notification.status_code;
    const grossAmount = notification.gross_amount;

    const expectedSignature = crypto
      .createHash('sha512')
      .update(`${orderId}${statusCode}${grossAmount}${serverKey}`)
      .digest('hex');

    if (signatureKey !== expectedSignature) {
      logger.error('Midtrans webhook signature verification failed');
      return res.status(400).json({
        error: {
          code: 'WEBHOOK_SIGNATURE_INVALID',
          message: 'Webhook signature verification failed',
        },
      });
    }

    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;

    // Extract userId from order_id (format: SUB-{userId}-{timestamp})
    const userIdMatch = orderId.match(/SUB-([^-]+)-/);
    const userId = userIdMatch ? userIdMatch[1] : null;

    if (!userId) {
      logger.error('Could not extract userId from Midtrans order_id:', orderId);
      return res.json({ received: true });
    }

    // Determine plan type from custom_field2 or amount
    const planType = notification.custom_field2 || (parseFloat(grossAmount) > 50 ? 'yearly' : 'monthly');

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        // Payment successful
        const expiryDate = paymentService.calculateExpiryDate(planType);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'pro',
            subscriptionExpiry: expiryDate,
          },
        });

        await prisma.transaction.create({
          data: {
            userId,
            provider: 'midtrans',
            plan: planType,
            amount: parseFloat(grossAmount),
            currency: notification.currency || 'IDR',
            status: 'completed',
            externalId: orderId,
          },
        });

        logger.info(`Midtrans subscription activated for user ${userId}`);
      }
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      // Payment failed
      await prisma.transaction.create({
        data: {
          userId,
          provider: 'midtrans',
          plan: planType,
          amount: parseFloat(grossAmount),
          currency: notification.currency || 'IDR',
          status: 'failed',
          externalId: orderId,
        },
      });

      logger.warn(`Midtrans payment failed for user ${userId}: ${transactionStatus}`);
    }

    return res.json({ received: true });
  } catch (error: any) {
    logger.error('Midtrans webhook processing error:', error);
    return res.status(500).json({
      error: {
        code: 'WEBHOOK_PROCESSING_ERROR',
        message: 'Failed to process webhook',
      },
    });
  }
});

export default router;
