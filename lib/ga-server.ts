import { createHash } from 'crypto';

/**
 * Envio de eventos para o GA4 a partir do servidor (Measurement Protocol).
 *
 * Serve para o que acontece longe do navegador: a assinatura confirmada pela
 * Stripe e as cobranças, que chegam pelo webhook. Assim contam mesmo quando a
 * pessoa fecha o separador, usa bloqueador de anúncios ou é cobrada 30 dias
 * depois, no fim do mês grátis.
 *
 * Precisa de GA4_API_SECRET na Vercel (GA4 > Admin > Fluxos de dados > Web >
 * Chaves secretas da API do Measurement Protocol). Sem ela, não envia nada e
 * nada falha. GA4_MP_DEBUG=1 usa o endpoint de validação e regista a resposta
 * nos logs, para testar sem sujar os relatórios.
 */

const MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 'G-30XJX7BT9D';

type GaValor = string | number | boolean | GaValor[] | { [k: string]: GaValor } | undefined;
type GaParams = Record<string, GaValor>;

/** Identificadores do GA4 lidos dos cookies do pedido (ver lerIdsGa). */
export type IdsGa = { clientId?: string; sessionId?: string };

/**
 * Lê o client_id (cookie _ga) e o session_id (cookie _ga_<ID>) de um pedido.
 *
 * _ga vale "GA1.1.123456789.1700000000" e o client_id são os dois últimos
 * blocos. O cookie da sessão tem dois formatos: o antigo "GS1.1.<sessão>.…" e
 * o novo "GS2.1.s<sessão>$o1$g1…".
 */
export function lerIdsGa(cookieHeader: string | null): IdsGa {
  if (!cookieHeader) return {};
  const cookies = Object.fromEntries(
    cookieHeader.split(';').flatMap((par) => {
      const i = par.indexOf('=');
      if (i < 0) return [];
      const valor = par.slice(i + 1).trim();
      // Um cookie mal codificado não pode impedir o checkout.
      try {
        return [[par.slice(0, i).trim(), decodeURIComponent(valor)]];
      } catch {
        return [[par.slice(0, i).trim(), valor]];
      }
    })
  );

  const ga = cookies['_ga']?.split('.');
  const clientId = ga && ga.length >= 4 ? `${ga[2]}.${ga[3]}` : undefined;

  const gaSessao = cookies[`_ga_${MEASUREMENT_ID.replace(/^G-/, '')}`];
  const sessionId =
    gaSessao?.match(/^GS2\.\d+\.s(\d+)/)?.[1] ?? gaSessao?.match(/^GS1\.\d+\.(\d+)\./)?.[1];

  return { clientId, sessionId };
}

/**
 * client_id de reserva para quem não tinha o cookie _ga (bloqueador, ou
 * assinatura anterior a esta medição). A receita conta na mesma, sem origem.
 * Deriva do cliente da Stripe por hash, para não enviar o id real ao Google.
 */
export function clientIdDeReserva(stripeCustomerId: string): string {
  const hash = createHash('sha256').update(stripeCustomerId).digest();
  return `${hash.readUInt32BE(0)}.${hash.readUInt32BE(4)}`;
}

export async function enviarEventoGa(
  clientId: string,
  nome: string,
  params: GaParams = {},
  opcoes: { sessionId?: string } = {}
): Promise<void> {
  const apiSecret = process.env.GA4_API_SECRET;
  const debug = process.env.GA4_MP_DEBUG === '1';
  if (!apiSecret) return;
  // Só a produção mede, como o gtag do layout. O debug permite testar num preview.
  if (process.env.VERCEL_ENV !== 'production' && !debug) return;

  const url =
    `https://www.google-analytics.com/${debug ? 'debug/' : ''}mp/collect` +
    `?measurement_id=${MEASUREMENT_ID}&api_secret=${apiSecret}`;

  const body = {
    client_id: clientId,
    events: [
      {
        name: nome,
        params: {
          ...params,
          ...(opcoes.sessionId ? { session_id: opcoes.sessionId } : {}),
          // Sem tempo de envolvimento o evento não aparece em alguns relatórios.
          engagement_time_msec: 1,
        },
      },
    ],
  };

  try {
    const res = await fetch(url, { method: 'POST', body: JSON.stringify(body) });
    if (debug) console.log(`[GA4 MP] ${nome}`, res.status, await res.text());
  } catch (error) {
    // A medição nunca pode fazer falhar o webhook da Stripe.
    console.warn(`[GA4 MP] Falha ao enviar ${nome}`, error);
  }
}
