import { syncStripeDataToKV } from '@/db/queries/kv';
import { stripe } from '@/db/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'payment_intent.succeeded', // When payment is processed successfully
  'payment_intent.payment_failed', // When payment fails
  'payment_intent.created',
  'payment_intent.canceled',
];

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  if (!signature) return NextResponse.json({}, { status: 400 });

  async function doEventProcessing() {
    if (typeof signature !== 'string') {
      throw new Error("[STRIPE HOOK] Header isn't a string???");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    await processEvent(event);
  }

  try {
    await doEventProcessing();
  } catch (err) {
    console.error('[STRIPE HOOK] Error processing event', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }

  return NextResponse.json({ received: true });
}

async function processEvent(event: Stripe.Event) {
  if (!allowedEvents.includes(event.type as Stripe.Event.Type)) {
    return;
  }

  let customerId: string | null = null;

  // Extract customer ID based on event type
  try {
    const object = event.data.object;

    if (event.type === 'checkout.session.completed') {
      customerId = (object as Stripe.Checkout.Session).customer as string;
    } else if (event.type.startsWith('payment_intent.')) {
      customerId = (object as Stripe.PaymentIntent).customer as string;
    } else if (event.type.startsWith('charge.')) {
      customerId = (object as Stripe.Charge).customer as string;
    } else {
      customerId = (object as any).customer;
    }

    console.log(`Extracted customer ID: ${customerId}`);
  } catch (error) {
    console.error('Error extracting customer ID:', error);
    throw error;
  }

  if (!customerId) {
    console.error(`No customer ID in event ${event.type}`, event.data.object);
    return;
  }

  try {
    console.log(`Syncing data for customer ${customerId}`);
    await syncStripeDataToKV(customerId);
    console.log('Sync completed successfully');
    return true;
  } catch (error) {
    console.error(`Error syncing data for customer ${customerId}:`, error);
    throw error;
  }
}
