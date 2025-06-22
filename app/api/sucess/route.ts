'use server';

import { kv } from '@/db';
import { syncStripeDataToKV } from '@/db/queries/kv';
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const stripeCustomerId = await kv.get(`stripe:user:${user.id}`);
    if (!stripeCustomerId) {
      console.log('⚠️ No stripe customer ID found, redirecting to home');
      return redirect('/');
    }

    console.log(`🔄 Success route: syncing data for customer ${stripeCustomerId}`);

    // ✅ Fixed: Added proper error handling
    await syncStripeDataToKV(stripeCustomerId as string, user.id);

    console.log('✅ Success route: sync completed');
    return redirect('/');
  } catch (error) {
    console.error('❌ Error in success route:', error);
    // Still redirect but log the error
    return redirect('/?error=sync_failed');
  }
}
