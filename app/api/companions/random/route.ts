import { NextResponse } from 'next/server';
import { getRandomCompanions } from '@/db/queries/companions';
import { PlanType } from '@/db/queries/kv';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const companions = await getRandomCompanions([
      PlanType.VIP,
      PlanType.PLUS,
      PlanType.CLASSIC,
      PlanType.FREE,
    ]);
    return NextResponse.json(companions);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
