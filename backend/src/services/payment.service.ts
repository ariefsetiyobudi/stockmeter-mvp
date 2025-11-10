import {
  stripeClient,
  paypalClient,
  midtransSnap,
  subscriptionPlans,
  PaymentProvider,
  SubscriptionPlanType,
} from '../config/payment.config';
import paypal from '@paypal/checkout-server-sdk';
import { logger } from '../utils/logger';

export interface PaymentSession {
  sessionId: string;
  checkoutUrl: string;
  provider: PaymentProvider;
}

export interface SubscriptionStatus {
  status: 'free' | 'pro' | 'expired';
  expiryDate: Date | null;
  autoRenew: boolean;
}

export class PaymentService {
  /**
   * Create a subscription with Stripe
   */
  async createStripeSubscription(
    userId: string,
    userEmail: string,
    planType: SubscriptionPlanType
  ): Promise<PaymentSession> {
    try {
      const plan = subscriptionPlans[planType];
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Create a Checkout Session
      const session = await stripeClient.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: plan.currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: `Stockmeter ${plan.name} Subscription`,
              },
              unit_amount: plan.price * 100, // Stripe uses cents
              recurring: {
                interval: plan.interval as 'month' | 'year',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${frontendUrl}/payment/cancel`,
        customer_email: userEmail,
        metadata: {
          userId,
          planType,
        },
      });

      logger.info(`Stripe subscription session created for user ${userId}`);

      return {
        sessionId: session.id,
        checkoutUrl: session.url || '',
        provider: 'stripe',
      };
    } catch (error: any) {
      logger.error('Stripe subscription creation failed:', error);
      throw new Error(`Stripe error: ${error.message}`);
    }
  }

  /**
   * Create a subscription with PayPal
   */
  async createPayPalSubscription(
    userId: string,
    planType: SubscriptionPlanType
  ): Promise<PaymentSession> {
    try {
      const plan = subscriptionPlans[planType];
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      // Create a subscription plan first (in production, you'd create this once and reuse)
      const planRequest = new paypal.orders.OrdersCreateRequest();
      planRequest.prefer('return=representation');
      planRequest.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: plan.currency,
              value: plan.price.toString(),
            },
            description: `Stockmeter ${plan.name} Subscription`,
            custom_id: userId,
          },
        ],
        application_context: {
          return_url: `${frontendUrl}/payment/success`,
          cancel_url: `${frontendUrl}/payment/cancel`,
          brand_name: 'Stockmeter',
          user_action: 'PAY_NOW',
        },
      });

      const response = await paypalClient.execute(planRequest);
      const order = response.result as any;

      // Get approval URL
      const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href || '';

      logger.info(`PayPal subscription order created for user ${userId}`);

      return {
        sessionId: order.id,
        checkoutUrl: approvalUrl,
        provider: 'paypal',
      };
    } catch (error: any) {
      logger.error('PayPal subscription creation failed:', error);
      throw new Error(`PayPal error: ${error.message}`);
    }
  }

  /**
   * Create a subscription with Midtrans
   */
  async createMidtransSubscription(
    userId: string,
    userEmail: string,
    userName: string,
    planType: SubscriptionPlanType
  ): Promise<PaymentSession> {
    try {
      const plan = subscriptionPlans[planType];

      const parameter = {
        transaction_details: {
          order_id: `SUB-${userId}-${Date.now()}`,
          gross_amount: plan.price,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          email: userEmail,
          first_name: userName,
        },
        item_details: [
          {
            id: planType,
            price: plan.price,
            quantity: 1,
            name: plan.name,
          },
        ],
        callbacks: {
          finish: `${process.env.FRONTEND_URL}/payment/success`,
          error: `${process.env.FRONTEND_URL}/payment/cancel`,
          pending: `${process.env.FRONTEND_URL}/payment/pending`,
        },
        custom_field1: userId,
        custom_field2: planType,
      };

      const transaction = await midtransSnap.createTransaction(parameter);

      logger.info(`Midtrans subscription transaction created for user ${userId}`);

      return {
        sessionId: transaction.token,
        checkoutUrl: transaction.redirect_url,
        provider: 'midtrans',
      };
    } catch (error: any) {
      logger.error('Midtrans subscription creation failed:', error);
      throw new Error(`Midtrans error: ${error.message}`);
    }
  }

  /**
   * Create subscription based on provider
   */
  async createSubscription(
    userId: string,
    userEmail: string,
    userName: string,
    planType: SubscriptionPlanType,
    provider: PaymentProvider
  ): Promise<PaymentSession> {
    switch (provider) {
      case 'stripe':
        return this.createStripeSubscription(userId, userEmail, planType);
      case 'paypal':
        return this.createPayPalSubscription(userId, planType);
      case 'midtrans':
        return this.createMidtransSubscription(userId, userEmail, userName, planType);
      default:
        throw new Error(`Unsupported payment provider: ${provider}`);
    }
  }

  /**
   * Calculate subscription expiry date
   */
  calculateExpiryDate(planType: SubscriptionPlanType): Date {
    const now = new Date();
    if (planType === 'monthly') {
      now.setMonth(now.getMonth() + 1);
    } else {
      now.setFullYear(now.getFullYear() + 1);
    }
    return now;
  }
}

export const paymentService = new PaymentService();
