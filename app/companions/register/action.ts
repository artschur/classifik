"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";

export const completeFirstStepRegistration = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  // Clerk's update is a deep merge, so we only need to
  // send the keys we want to change/add.
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true, // Mark step 1 done
      isRegistrationComplete: true,
      isCompanion: true,        // Set the role
    },
  });

  return { success: true }
}
