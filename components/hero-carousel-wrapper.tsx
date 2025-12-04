import { getRandomCompanions } from "@/db/queries/companions";
import { HeroCarousel } from "./hero-carousel";
import { PlanType } from "@/db/queries/kv";
import { CompanionCard } from "./companionsList";

export async function HeroCarouselWrapper({ plans, citySlug }: { plans?: PlanType[]; citySlug?: string }) {
  const companions = await getRandomCompanions(plans, citySlug);
  return <HeroCarousel companions={companions} />;
}
