import { PlanType } from '@/db/queries/kv';

const protectedRoutes: Record<PlanType, string[]> = {
  free: [],
  basico: [],
  plus: ['/block'],
  vip: ['/', '/companions/register/audio'],
};

export function isAllowed(userPlan: PlanType, pathname: string): boolean {
  // Combine all protected routes from other plans
  const allProtectedRoutes = Object.values(protectedRoutes).flat();

  // If the pathname is not protected, allow access
  if (!allProtectedRoutes.includes(pathname)) return true;

  // If it is protected, allow only if the user's plan includes it
  return protectedRoutes[userPlan]?.includes(pathname) ?? false;
}
