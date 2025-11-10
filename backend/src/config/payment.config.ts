import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import midtransClient from 'midtrans-client';
import dotenv from 'dotenv';

dotenv.config();

// Stripe Configuration
export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export const stripeConfig = {
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
};

// PayPal Configuration
function getPayPalEnvironment() {
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  const clientId = process.env.PAYPAL_CLIENT_ID || '';
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';

  if (mode === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret);
  }
  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

export const paypalClient = new paypal.core.PayPalHttpClient(getPayPalEnvironment());

export const paypalConfig = {
  mode: process.env.PAYPAL_MODE || 'sandbox',
  clientId: process.env.PAYPAL_CLIENT_ID || '',
};

// Midtrans Configuration
export const midtransSnap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY || '',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
});

export const midtransConfig = {
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
};

// Subscription Plans
export const subscriptionPlans = {
  monthly: {
    price: 12, // $12/month
    currency: 'USD',
    interval: 'month',
    name: 'Pro Monthly',
  },
  yearly: {
    price: 120, // $120/year (equivalent to $10/month)
    currency: 'USD',
    interval: 'year',
    name: 'Pro Yearly',
  },
};

export type PaymentProvider = 'stripe' | 'paypal' | 'midtrans';
export type SubscriptionPlanType = 'monthly' | 'yearly';
