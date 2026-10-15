import 'server-only';

import crypto from 'node:crypto';

/**
 * Link de pré-visualização de um perfil em pausa: /companions/<id>?ver=<código>.
 *
 * O admin cria o perfil de uma candidata em pausa e envia-lhe este link para
 * ela ver como fica antes de autorizar. Sem o código, um perfil em pausa
 * continua a dar 404 a toda a gente menos ao admin.
 *
 * O código é uma assinatura do id com um segredo do servidor: não se adivinha
 * a partir do número do perfil, que é sequencial e aparece nos endereços.
 */
function chave(): string {
  const segredo = process.env.PREVIEW_SECRET || process.env.CLERK_SECRET_KEY;
  if (!segredo) throw new Error('Sem segredo para assinar links de pré-visualização');
  return segredo;
}

export function previewToken(companionId: number): string {
  return crypto.createHmac('sha256', chave()).update(`preview:${companionId}`).digest('base64url').slice(0, 24);
}

export function isValidPreviewToken(companionId: number, token: string | null | undefined): boolean {
  if (!token) return false;
  const esperado = Buffer.from(previewToken(companionId));
  const recebido = Buffer.from(token);
  return recebido.length === esperado.length && crypto.timingSafeEqual(recebido, esperado);
}
