import { getRandomCompanions } from "@/db/queries/companions";
import { HeroCarousel } from "./hero-carousel";
import { PlanType } from "@/db/queries/kv";
import { CompanionCard } from "./companionsList";

export async function HeroCarouselWrapper({ plans }: { plans?: PlanType[] }) {
  const companions = await getRandomCompanions(plans);
  return <HeroCarousel companions={companions} />;
}
