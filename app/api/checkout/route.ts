import { kv } from '@/db';
import { stripe } from '@/db/stripe';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(req: Request) {
  const user = await currentUser();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get the price ID from the URL
  const url = new URL(req.url);
  const priceId = url.searchParams.get('priceId');

  if (!priceId) {
    return new Response('Missing price ID', { status: 400 });
  }

  const userId = user.id;

  // Get the stripeCustomerId from your KV store
  let stripeCustomerId = await kv.get(`stripe:user:${userId}`);

  if (!stripeCustomerId) {
    // Create customer code as before
  }

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
  });

  return Response.redirect(checkout.url as string);
}
