'use server';

import { PlanType } from '@/db/queries/kv';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export async function handleOnboard(formData: FormData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('No Logged In User');
    }

    // Extract isCompanion from form data and convert to boolean
    const isCompanionValue = formData.get('isCompanion');
    const isCompanion = isCompanionValue === 'true';

    console.log('Onboarding data:', {
      userId,
      isCompanion,
      formDataValue: isCompanionValue,
      formDataType: typeof isCompanionValue,
    });

    if (isCompanionValue === null) {
      throw new Error('Missing isCompanion value in form data');
    }

    const client = await clerkClient();

    console.log('Updating user metadata...');

    const metadata = {
      onboardingComplete: true,
      isCompanion: isCompanion,
      plan: (await client.users.getUser(userId)).publicMetadata.plan || 'free',
    };

    console.log('Metadata to be set:', metadata);

    const updatedUser = await client.users.updateUser(userId, {
      publicMetadata: metadata,
    });

    console.log('User updated successfully:', {
      userId: updatedUser.id,
      metadata: updatedUser.publicMetadata,
    });

    console.log('Redirecting...');

    // Redirect based on user type
    if (isCompanion) {
      redirect('/companions/register');
    } else {
      redirect('/location');
    }
  } catch (error) {
    // Check if this is a Next.js redirect error (which is expected)
    if (error && typeof error === 'object' && 'digest' in error) {
      // This is likely a Next.js redirect error, re-throw it
      throw error;
    }

    console.error('Error in handleOnboard:', error);
    throw new Error(
      `Error Updating User Metadata: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}
