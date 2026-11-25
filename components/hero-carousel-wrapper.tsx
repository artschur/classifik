import { getRandomCompanions } from "@/db/queries/companions";
import { HeroCarousel } from "./hero-carousel";
import { PlanType } from "@/db/queries/kv";

/**
 * Os três planos pagos. A ordem dentro do bloco (VIP, Plus, Clássico, e
 * sorteio dentro de cada plano) vem da própria consulta.
 */
const PLANOS_PAGOS = [PlanType.VIP, PlanType.PLUS, PlanType.CLASSIC];

/**
 * "Perfis em destaque": só perfis com plano pago e válido. Antes só entrava o
 * VIP, embora o plano Clássico também prometa aparecer aqui, e o bloco ficava
 * vazio (com título e setas) nos distritos sem nenhum VIP. Sem pagantes, não
 * aparece; os perfis gratuitos ficam na listagem geral.
 */
export async function HeroCarouselWrapper({ citySlug }: { citySlug?: string }) {
  const companions = await getRandomCompanions(PLANOS_PAGOS, citySlug).catch(() => []);
  if (companions.length === 0) return null;
  return <HeroCarousel companions={companions} />;
}
