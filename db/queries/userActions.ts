'use server'

import { auth } from "@clerk/nextjs/server";
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
