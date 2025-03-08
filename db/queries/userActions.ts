'use server';

import { auth, clerkClient } from "@clerk/nextjs/server";
import { db } from "..";
import { companionsTable } from "../schema";
import { eq } from "drizzle-orm";

export async function getEmail() {
  const { sessionClaims } = await auth();
  return sessionClaims?.email;
}

export async function getLastSignIn() {
  const { sessionClaims } = await auth();
  return sessionClaims?.last_sign_in;
}

export async function checkEmailExists(emailRegistered: string | undefined) {
  if (!emailRegistered) {
    return false;
  }
  const user = await db
    .select({ email: companionsTable.email })
    .from(companionsTable)
    .where(eq(companionsTable.email, emailRegistered));

  return user.length > 0;
}

export async function getLastSignInByClerkId(clerkId: string) {
  const user = await clerkClient();
  try {
    const lastSignIn = (await user.users.getUser(clerkId)).lastSignInAt;
    const getRelativeTime = (timestamp: number) => {
      const msPerHour = 1000 * 60 * 60;
      const elapsed = new Date().getTime() - timestamp;
      const hours = Math.floor(elapsed / msPerHour);

      if (hours < 24) {
        return `${hours} hours ago`;
      } else {
        const days = Math.floor(hours / 24);
        return days === 1 ? "1 day ago" : `${days} days ago`;
      }
    };
    if (!lastSignIn) {
      return "Never";
    }
    return getRelativeTime(lastSignIn);
  }
  catch (error) {
    return "Never";
  }
}

export async function getClerkIdByCompanionId(companionId: number): Promise<string> {
  const companion = await db
    .select({ auth_id: companionsTable.auth_id })
    .from(companionsTable)
    .where(eq(companionsTable.id, companionId));

  return companion[0].auth_id;
}