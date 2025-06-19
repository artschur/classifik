'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function handleOnboard({ isCompanion }: { isCompanion: boolean }) {
  const client = await clerkClient();
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return { message: 'No Logged In User' };
  }

  try {
    await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: true,
        isCompanion: isCompanion,
        plan: 'free',
      },
    });
    return { message: 'User metadata Updated' };
  } catch (e) {
    return { message: 'Error Updating User Metadata' };
  } finally {
    isCompanion ? redirect('/companions/register') : redirect('/location');
  }
}
