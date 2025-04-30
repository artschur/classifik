import { kv } from '@/db';
import { stripe } from '@/db/stripe';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get the price ID from the URL
  const url = new URL(req.url);
  const priceId = url.searchParams.get('priceId');

  if (!priceId) {
    return new Response('Missing price ID', { status: 400 });
  }

  // Get the stripeCustomerId from your KV store
  let stripeCustomerId = await kv.get(`stripe:user:${userId}`);

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      metadata: {
        userId: userId,
      },
    });

    stripeCustomerId = customer.id;

    await kv.set(`stripe:user:${userId}`, stripeCustomerId);
  }
  console.log('routes.ts checkout', userId, stripeCustomerId);
  const checkout = await stripe.checkout.sessions.create({
    customer: stripeCustomerId as string,
    success_url: 'http://localhost:3000/success',
    cancel_url: 'https://classifik.vercel.app/cancelled',
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
    },
  });

  return Response.redirect(checkout.url as string);
}
