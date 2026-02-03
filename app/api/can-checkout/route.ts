import { auth } from "@clerk/nextjs/server";
import { hasActiveAd } from "@/db/queries/kv";
import { isVerificationPending } from "@/app/actions/document-verification";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ canCheckout: false, redirect: "/sign-in" });
  }

  const [verificationPending, hasPaid] = await Promise.all([
    isVerificationPending(userId),
    hasActiveAd(userId),
  ]);

  if (verificationPending) {
    return NextResponse.json({
      canCheckout: false,
      redirect: "/companions/verification/pending",
    });
  }

  if (hasPaid) {
    return NextResponse.json({ canCheckout: false, redirect: "/profile" });
  }

  return NextResponse.json({ canCheckout: true });
}
