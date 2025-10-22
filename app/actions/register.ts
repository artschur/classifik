'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { registerCompanion } from '@/db/queries/companions';
import { RegisterCompanionFormValues } from '@/components/formCompanionRegister';

export async function registerCompanionAction(companionPayload: RegisterCompanionFormValues) {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    // This is the only place an auth error should originate
    throw new Error('Authentication failed: No user ID found.');
  }

  // 2. Reliably get the user's email
  let email = sessionClaims?.email;
  if (!email) {
    try {
      const cc = await clerkClient();
      const user = await cc.users.getUser(userId);
      email =
        user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
        user.emailAddresses?.[0]?.emailAddress;
    } catch (error) {
      console.error('Failed to fetch user from Clerk:', error);
      throw new Error('Could not retrieve user email.');
    }
  }

  if (!email) {
    throw new Error('Authentication failed: No email found for user.');
  }

  // 3. Call the strict, predictable database helper
  const companion = await registerCompanion(companionPayload, userId, email);

  return companion;
}
