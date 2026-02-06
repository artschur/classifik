"use server";

import { clerkClient, auth } from "@clerk/nextjs/server";

export const completeFirstStepRegistration = async () => {
  const { userId } = await auth();

  if (!userId) throw new Error("Unauthorized");

  const client = await clerkClient();

  // Clerk's update is a deep merge, so we only need to
  // send the keys we want to change/add.
  return client.users.updateUserMetadata(userId, {
    publicMetadata: {
      onboardingComplete: true, // Mark step 1 done
      isCompanion: true,        // Set the role
    },
  });
}
