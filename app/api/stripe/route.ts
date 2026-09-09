import { kv } from '@/db';
import { syncStripeDataToKV } from '@/db/queries/kv';
import { upsertSubscriptionFromStripe } from '@/db/queries/subscriptions';
import { stripe } from '@/db/stripe';
import { clerkClient } from '@clerk/nextjs/server';
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
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
];

// Track processed events to prevent duplicates
const processedEvents = new Set<string>();

async function resolveClerkIdFromCustomer(customerId: string): Promise<string | undefined> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (!('deleted' in customer) && customer.metadata?.userId) {
      return customer.metadata.userId;
    }
  } catch (e) {
    console.warn('Unable to retrieve customer', customerId, e);
  }
  return undefined;
}

/**
 * O id da assinatura de uma fatura deixou de viver em invoice.subscription
 * nesta versão da API da Stripe e passou para
 * invoice.parent.subscription_details.subscription.
 */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | undefined {
  const sub = invoice.parent?.subscription_details?.subscription;
  if (!sub) return undefined;
  return typeof sub === 'string' ? sub : sub.id;
}

export async function GET(req: Request) {
  return Response.json({ message: 'Hello from Stripe webhook!' });
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

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
  if (processedEvents.has(event.id)) {
    return;
  }

  processedEvents.add(event.id);

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
      const clerkId = session.metadata?.userId as string | undefined;
      const plan = session.metadata?.planType;

      if (!clerkId) {
        console.error('No Clerk ID found in session metadata');
        return;
      }

      console.log(
        `🎯 Processing checkout completion for user ${clerkId}, customer ${customerId}, plan ${plan}`
      );

      const client = await clerkClient();
      await client.users.updateUserMetadata(clerkId, {
        publicMetadata: {
          plan: plan,
          stripeCustomerId: customerId,
        },
      });

      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await upsertSubscriptionFromStripe({
          subscription,
          clerkId,
          stripeCustomerId: customerId,
        });
      } else {
        await syncStripeDataToKV(customerId, clerkId);
      }
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted' ||
      event.type === 'customer.subscription.trial_will_end' ||
      event.type === 'customer.subscription.paused' ||
      event.type === 'customer.subscription.resumed'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      const clerkId = await resolveClerkIdFromCustomer(customerId);

      if (!clerkId) {
        console.warn('⚠️ Missing Clerk ID for subscription event');
        return;
      }

      await upsertSubscriptionFromStripe({
        subscription,
        clerkId,
        stripeCustomerId: customerId,
      });

      if (event.type === 'customer.subscription.deleted') {
        const client = await clerkClient();
        await client.users.updateUserMetadata(clerkId, {
          publicMetadata: { plan: 'free' },
        });
      }

      // Handle trial-specific events
      if (event.type === 'customer.subscription.trial_will_end') {
        console.log(
          `⚠️ Trial ending soon for user ${clerkId}, subscription ${subscription.id}`
        );
        // You could send an email notification here
        // The trial ends in 3 days (or immediately if trial is less than 3 days)
      }

      if (event.type === 'customer.subscription.paused') {
        console.log(
          `⏸️ Subscription paused for user ${clerkId}, subscription ${subscription.id}`
        );
        // Subscription was paused due to missing payment method after trial
      }

      if (event.type === 'customer.subscription.resumed') {
        console.log(
          `▶️ Subscription resumed for user ${clerkId}, subscription ${subscription.id}`
        );
        // Subscription was resumed after adding payment method
      }
    }

    // Handle failed payments
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      const clerkId = await resolveClerkIdFromCustomer(customerId);

      if (clerkId && subscriptionId) {
        console.log(
          `💳 Payment failed for user ${clerkId}, subscription ${subscriptionId}`
        );
        // Nada a fazer aqui além do log: quando a Stripe esgotar as
        // tentativas de cobrança, ela move o status da assinatura (para
        // 'past_due' e depois 'canceled'/'unpaid'), e isso chega como
        // customer.subscription.updated/deleted, tratado acima.
      }
    }

    // Cobrança com sucesso: é aqui que o acesso é de fato prolongado, tanto
    // na primeira cobrança pós-trial como em cada renovação mensal. Sem este
    // bloco, o evento chegava e não fazia nada: o gatilho estava na lista de
    // eventos permitidos, mas não existia nenhum tratamento para ele.
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      const subscriptionId = getInvoiceSubscriptionId(invoice);

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const clerkId = await resolveClerkIdFromCustomer(customerId);

        if (clerkId) {
          await upsertSubscriptionFromStripe({
            subscription,
            clerkId,
            stripeCustomerId: customerId,
          });
          console.log(
            `💰 Cobrança confirmada para user ${clerkId}, assinatura ${subscriptionId}`
          );
        } else {
          console.warn('⚠️ Missing Clerk ID for invoice.payment_succeeded');
        }
      }
    }

    console.log('Sync completed successfully');
  } catch (error) {
    console.error(`Error syncing data for customer ${customerId}:`, error);
    throw error;
  }
}
