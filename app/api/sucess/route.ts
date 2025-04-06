'use server';

import { kv } from '@/db';
import { syncStripeDataToKV } from '@/db/queries/kv';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
  const user = await currentUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stripeCustomerId = await kv.get(`stripe:user:${user.id}`);
  if (!stripeCustomerId) {
    return redirect('/');
  }

  await syncStripeDataToKV(stripeCustomerId as string, user.id);
  return redirect('/');
}
