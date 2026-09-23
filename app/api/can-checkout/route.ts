import { auth } from "@clerk/nextjs/server";
import { hasActiveAd } from "@/db/queries/kv";
import { isUserACompanion } from "@/db/queries/companions";
import { isVerificationPending } from "@/app/actions/document-verification";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ canCheckout: false, redirect: "/sign-in" });
  }

  // Um plano destaca um anúncio, por isso tem de existir anúncio. Quem
  // comprava sem perfil ficava com o pagamento pendurado no vazio: o aviso da
  // Stripe chegava, não encontrava a quem atribuir o plano, e desistia em
  // silêncio. A pessoa pagava e continuava a aparecer como anúncio gratuito.
  if (!(await isUserACompanion(userId))) {
    return NextResponse.json({
      canCheckout: false,
      redirect: "/companions/register",
    });
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
