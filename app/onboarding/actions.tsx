'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function handleOnboard(formData: FormData) {
  const client = await clerkClient();
  const { userId } = await auth();

  if (!userId) {
    throw new Error('No Logged In User');
  }

  // Extract isCompanion from form data and convert to boolean
  const isCompanion = formData.get('isCompanion') === 'true';

  try {
    await client.users.updateUser(userId, {
      publicMetadata: {
        onboardingComplete: true,
        isCompanion: isCompanion,
        plan: 'free',
      },
    });
  } catch (e) {
    throw new Error('Error Updating User Metadata');
  }

  // Redirect based on user type
  isCompanion ? redirect('/companions/register') : redirect('/location');
}
