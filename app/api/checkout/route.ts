import { db, kv } from '@/db';
import { stripe } from '@/db/stripe';
import { auth } from '@clerk/nextjs/server';
import { priceIdToPlan } from '@/db/queries/kv';
import { companionsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new Response('Unauthorized', { status: 401 });
    }

    const url = new URL(req.url);
    const priceId = url.searchParams.get('priceId');

    if (!priceId) {
      return new Response('Missing price ID', { status: 400 });
    }

    // ✅ Validate that the priceId exists in our plan mapping
    const planInfo = priceIdToPlan[priceId];
    if (!planInfo) {
      return new Response('Invalid price ID', { status: 400 });
    }

    let stripeCustomerId = await kv.get(`stripe:user:${userId}`);

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: {
          userId: userId,
        },
      });

      stripeCustomerId = customer.id;
      await db
        .update(companionsTable)
        .set({
          stripe_customer_id: stripeCustomerId as string,
        })
        .where(eq(companionsTable.auth_id, userId));

      await kv.set(`stripe:user:${userId}`, stripeCustomerId);
    }

    console.log(
      `🛒 Creating checkout for user ${userId}, customer ${stripeCustomerId}, plan ${planInfo.name}`,
    );

    const checkout = await stripe.checkout.sessions.create({
      customer: stripeCustomerId as string,
      success_url: 'https://onesugar.app/success',
      cancel_url: 'https://onesugar.app/cancelled',
      currency: 'eur',
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: userId,
        stripeCustomerId: stripeCustomerId as string,
        planType: planInfo.name, // ✅ Fixed: store the plan name, not priceId
      },
    });

    return Response.redirect(checkout.url as string);
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
