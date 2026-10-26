import { auth } from "@clerk/nextjs/server";
import { hasActiveAd } from "@/db/queries/kv";
import { isUserACompanion } from "@/db/queries/companions";
import { acessoAPlanos, DESTINO_SEM_ACESSO } from "@/db/queries/verificacao";
import { isAdmin } from "@/components/header";
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
  //
  // E o anúncio tem de estar verificado: sem selo, o botão leva-a ao passo da
  // verificação. Os admins ficam isentos, para as compras de teste.
  if (isAdmin(userId)) {
    if (!(await isUserACompanion(userId))) {
      return NextResponse.json({ canCheckout: false, redirect: "/companions/register" });
    }
  } else {
    const acesso = await acessoAPlanos(userId);
    if (acesso !== "pode") {
      return NextResponse.json({ canCheckout: false, redirect: DESTINO_SEM_ACESSO[acesso] });
    }
  }

  if (await hasActiveAd(userId)) {
    return NextResponse.json({ canCheckout: false, redirect: "/profile" });
  }

  return NextResponse.json({ canCheckout: true });
}
