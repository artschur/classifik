import { PlanType } from '@/db/queries/kv';

export {};

declare global {
  interface CustomJwtSessionClaims {
    email?: string;
    last_sign_in?: string;
    plan?: PlanType;
    metadata: {
      plan?: PlanType;
      onboardingComplete?: boolean;
      isCompanion?: boolean;
    };
  }
}
