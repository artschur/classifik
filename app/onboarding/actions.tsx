"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function handleOnboard(formData: FormData) {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("No Logged In User");
    }

    const isCompanionValue = formData.get("isCompanion");
    const isCompanion = isCompanionValue === "true";

    if (isCompanionValue === null) {
      throw new Error("Missing isCompanion value in form data");
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // 1. Prepare the new metadata
    const metadata = {
      onboardingComplete: true,
      isCompanion: isCompanion,
      // Logic: Companions start at 'false' (trap active).
      // Clients start at 'true' (trap bypassed).
      hasUploadedDocs: isCompanion ? false : true,
      plan: user.publicMetadata.plan || "free",
    };

    // 2. Update Clerk
    await client.users.updateUser(userId, {
      publicMetadata: metadata,
    });

    // 3. Redirect logic
    if (isCompanion) {
      redirect("/companions/register");
    } else {
      redirect("/location");
    }
  } catch (error) {
    // Next.js redirect errors must be re-thrown
    if (error && typeof error === "object" && "digest" in error) {
      throw error;
    }

    console.error("Error in handleOnboard:", error);
    throw new Error(
      `Error Updating User Metadata: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    );
  }
}
