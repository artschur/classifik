import { db } from '@/db';
import { syncStripeDataToKV } from '@/db/queries/kv';
import { companionsTable, paymentsTable } from '@/db/schema';
import { stripe } from '@/db/stripe';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const allowedEvents: Stripe.Event.Type[] = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.created',
  'payment_intent.canceled',
  'charge.updated',
];

// Track processed events to prevent duplicates
const processedEvents = new Set<string>();

export async function GET(req: Request) {
  return Response.json({ message: 'Hello from Stripe webhook!' });
}

export async function POST(req: Request) {
  console.log('hey');
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  console.log(body);
  if (!signature) return NextResponse.json({}, { status: 400 });
  try {
    if (typeof signature !== 'string') {
      throw new Error("[STRIPE HOOK] Header isn't a string");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    const session = event.data.object;
    const clerkId = (session as any).metadata?.userId;

    await processEvent(event, clerkId);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('[STRIPE HOOK] Error processing event', err);
    return NextResponse.json({ error: 'Webhook Error' }, { status: 400 });
  }
}

async function processEvent(event: Stripe.Event, clerkId: string) {
  console.log('processing event');
  if (processedEvents.has(event.id)) {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }

  processedEvents.add(event.id);

  if (!allowedEvents.includes(event.type as Stripe.Event.Type)) {
    console.log(`Event type ${event.type} not in allowed list, skipping`);
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
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const clerkId = session.metadata?.userId;

      if (clerkId) {
        await db
          .update(companionsTable)
          .set({
            stripe_customer_id: customerId,
            has_active_ad: true,
          })
          .where(eq(companionsTable.auth_id, clerkId));

        console.log(
          `Updated companion record for user ${clerkId} with Stripe ID ${customerId}`
        );

        await syncStripeDataToKV(customerId);
      } else {
        console.log(
          `No clerk ID found in session metadata for customer ${customerId}`
        );
      }
    }
    console.log('Sync completed successfully');
  } catch (error) {
    console.error(`Error syncing data for customer ${customerId}:`, error);
    throw error;
  }
}
