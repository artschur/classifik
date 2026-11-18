/**
 * Catálogo dos planos pagos: cada plano (Clássico, Plus, VIP) tem três
 * durações, todas subscrições que se renovam sozinhas até ela cancelar.
 *
 *   Plano     7 dias   15 dias   30 dias
 *   Clássico   15 €     25 €      40 €
 *   Plus       20 €     30 €      45 €
 *   VIP        25 €     35 €      50 €
 *
 * É a única fonte para a página de planos, o /api/checkout, o webhook da
 * Stripe e o GA4: um preço que não esteja aqui é recusado no checkout.
 *
 * Os ids são os preços da Stripe de produção (não são segredo: aparecem no
 * endereço do checkout). As variáveis de ambiente, se existirem, mandam:
 * os de 30 dias são os preços mensais de sempre (STRIPE_*_PRICE_ID), e os de
 * 7 e 15 dias foram criados a 17/11/2026 (lookup_key classic_7d, plus_15d…).
 *
 * Só no servidor: lê process.env. O ecrã recebe os dados prontos.
 */

export type PlanoPago = 'classic' | 'plus' | 'vip';
export type DiasPlano = 7 | 15 | 30;

export type OpcaoPlano = {
  dias: DiasPlano;
  /** Id do preço na Stripe. */
  precoId: string;
  /** Valor cobrado em cada período, em euros. */
  valor: number;
};

// Tolera um comentário colado ao valor (ex.: "price_… ##production vars").
const env = (nome: string, padrao: string) =>
  process.env[nome]?.replace(/\s+#.*$/, '').trim() || padrao;

export const PLANOS: Record<PlanoPago, OpcaoPlano[]> = {
  classic: [
    { dias: 7, valor: 15, precoId: env('STRIPE_CLASSIC_7D_PRICE_ID', 'price_1UcookEJQRIZgEwetyBC9X9h') },
    { dias: 15, valor: 25, precoId: env('STRIPE_CLASSIC_15D_PRICE_ID', 'price_1UcookEJQRIZgEweVzZ91e4O') },
    { dias: 30, valor: 40, precoId: env('STRIPE_BASIC_PRICE_ID', 'price_1RzJ4uEJQRIZgEwe5hn1BhP2') },
  ],
  plus: [
    { dias: 7, valor: 20, precoId: env('STRIPE_PLUS_7D_PRICE_ID', 'price_1UcoolEJQRIZgEwekLCd5wPo') },
    { dias: 15, valor: 30, precoId: env('STRIPE_PLUS_15D_PRICE_ID', 'price_1UcoolEJQRIZgEweUtUNI0Ur') },
    { dias: 30, valor: 45, precoId: env('STRIPE_PLUS_PRICE_ID', 'price_1RzJ8SEJQRIZgEweEvdcjATx') },
  ],
  vip: [
    { dias: 7, valor: 25, precoId: env('STRIPE_VIP_7D_PRICE_ID', 'price_1UcoolEJQRIZgEweBsb6jOK4') },
    { dias: 15, valor: 35, precoId: env('STRIPE_VIP_15D_PRICE_ID', 'price_1UcoomEJQRIZgEweWsgYiYSD') },
    { dias: 30, valor: 50, precoId: env('STRIPE_VIP_PRICE_ID', 'price_1RzJ9BEJQRIZgEweK9uKij7T') },
  ],
};

/**
 * Portal de cliente da Stripe (configuração criada a 17/11/2026): a sugar
 * cancela (no fim do período pago), faz upgrade (a diferença é cobrada já),
 * downgrade ou mudança para uma duração mais curta (só no fim do período),
 * muda o cartão e vê as faturas. Só deixa trocar entre os 9 preços acima.
 */
export const PORTAL_CONFIG_ID = env('STRIPE_PORTAL_CONFIG_ID', 'bpc_1Uct5yEJQRIZgEwevawCdgHB');

/** O plano e a duração de um preço da Stripe, ou undefined se não for um dos nossos. */
export function opcaoDoPreco(precoId: string): { plano: PlanoPago; opcao: OpcaoPlano } | undefined {
  for (const plano of Object.keys(PLANOS) as PlanoPago[]) {
    const opcao = PLANOS[plano].find((o) => o.precoId === precoId);
    if (opcao) return { plano, opcao };
  }
  return undefined;
}
