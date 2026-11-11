import { NextResponse, type NextRequest } from 'next/server';
import { searchByPhone } from '@/lib/admin-phone-search';

/** Busca de admin por telefone (GET ?tel=...). A verificação de admin está em searchByPhone. */
export async function GET(request: NextRequest) {
  const res = await searchByPhone(request.nextUrl.searchParams.get('tel') ?? '');
  const status = res.success ? 200 : res.error === 'Não autorizado' ? 403 : 400;
  return NextResponse.json(res, { status, headers: { 'Cache-Control': 'no-store' } });
}
