import crypto from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { db } from '@/db';
import { companionsTable } from '@/db/schema';

/**
 * Tradução das descrições dos perfis para a versão inglesa (/en).
 *
 * Usa a Cloud Translation API (v2, modelo NMT) com a chave em
 * GOOGLE_TRANSLATE_API_KEY. O modelo NMT é o que entra nos 500 mil caracteres
 * grátis por mês; o "Translation LLM" e a tradução de documentos têm outra
 * tabela de preços e não são usados aqui.
 *
 * Só se traduz quando o texto em português publicado muda: a impressão
 * digital desse texto fica em translation_source, e enquanto bater certo não
 * se volta a chamar o Google. A conta tem um limite diário de caracteres no
 * Google Cloud; quando é atingido, o Google recusa em vez de cobrar, e o
 * perfil fica com o português até à tentativa seguinte.
 *
 * Nada aqui lança erros para quem chama: uma falha na tradução nunca pode
 * impedir uma aprovação ou uma gravação.
 *
 * Este ficheiro não é 'use server' de propósito: as funções não verificam
 * quem chama e não podem ficar expostas ao navegador. As acções do admin
 * estão em app/actions/traducoes.ts.
 */

const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

export type MotivoFalha = 'sem-chave' | 'limite' | 'erro';

export type ResultadoTraducao =
  | { ok: true; textos: string[]; caracteres: number }
  | { ok: false; motivo: MotivoFalha };

/** Impressão digital do texto em português de um perfil. */
export function fonteDaTraducao(
  shortDescription: string | null | undefined,
  description: string | null | undefined,
): string {
  return crypto
    .createHash('sha256')
    .update(`${(shortDescription ?? '').trim()}\u0000${(description ?? '').trim()}`)
    .digest('hex');
}

/** Caracteres que o Google conta para estes textos. */
export function caracteresDe(textos: (string | null | undefined)[]): number {
  return textos.reduce((total, t) => total + (t?.trim().length ?? 0), 0);
}

/**
 * Traduz de português para inglês. Textos vazios voltam vazios e não são
 * enviados. A ordem da resposta é a dos textos recebidos.
 */
export async function traduzirParaIngles(
  textos: (string | null | undefined)[],
): Promise<ResultadoTraducao> {
  const chave = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!chave) return { ok: false, motivo: 'sem-chave' };

  const limpos = textos.map((t) => t?.trim() ?? '');
  const aEnviar = limpos.filter(Boolean);
  if (!aEnviar.length) return { ok: true, textos: limpos, caracteres: 0 };

  try {
    const resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No cabeçalho e não no endereço, para a chave não ficar nos registos.
        'X-Goog-Api-Key': chave,
      },
      body: JSON.stringify({
        q: aEnviar,
        source: 'pt',
        target: 'en',
        format: 'text',
        model: 'nmt',
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });

    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => '');
      // 403/429 com "rateLimitExceeded", "dailyLimitExceeded" ou "quota":
      // é o limite diário configurado no Google Cloud.
      const limite =
        resposta.status === 429 ||
        (resposta.status === 403 && /limit|quota/i.test(corpo));
      console.error('Tradução falhou:', resposta.status, corpo.slice(0, 300));
      return { ok: false, motivo: limite ? 'limite' : 'erro' };
    }

    const json = (await resposta.json()) as {
      data?: { translations?: { translatedText?: string }[] };
    };
    const traduzidos = json.data?.translations?.map((t) => t.translatedText ?? '') ?? [];
    if (traduzidos.length !== aEnviar.length) return { ok: false, motivo: 'erro' };

    let i = 0;
    return {
      ok: true,
      textos: limpos.map((t) => (t ? traduzidos[i++].trim() : '')),
      caracteres: caracteresDe(aEnviar),
    };
  } catch (error) {
    console.error('Tradução falhou:', error);
    return { ok: false, motivo: 'erro' };
  }
}

function refrescarPerfis() {
  revalidateTag('companion', 'max');
  revalidateTag('companions', 'max');
  revalidateTag('companions-filter', 'max');
}

export type EstadoTraducao =
  | 'atual'
  | 'traduzida'
  | 'sem-texto'
  | 'nao-encontrado'
  // O português mudou entre a leitura e a gravação (outra aprovação ou
  // edição ao mesmo tempo, ou o admin estava a rever um texto antigo).
  | 'desatualizada'
  | MotivoFalha;

/** O texto em português que foi lido, para só gravar se continuar igual. */
type PortuguesLido = { shortDescription: string | null; description: string };

/**
 * Garante que a versão inglesa corresponde ao texto em português publicado.
 * Se já corresponder, não faz nada (nem gasta caracteres), a não ser que se
 * peça `forcar`. Se o texto mudou e a tradução falhar, apaga a versão inglesa
 * antiga: é melhor mostrar o português com o aviso do que uma tradução de um
 * texto que já não existe.
 */
export async function garantirTraducao(
  companionId: number,
  { forcar = false }: { forcar?: boolean } = {},
): Promise<EstadoTraducao> {
  try {
    const [perfil] = await db
      .select({
        shortDescription: companionsTable.shortDescription,
        description: companionsTable.description,
        descriptionEn: companionsTable.descriptionEn,
        fonte: companionsTable.translation_source,
      })
      .from(companionsTable)
      .where(eq(companionsTable.id, companionId))
      .limit(1);
    if (!perfil) return 'nao-encontrado';

    const fonte = fonteDaTraducao(perfil.shortDescription, perfil.description);
    if (perfil.fonte === fonte && !forcar) return 'atual';

    if (!caracteresDe([perfil.shortDescription, perfil.description])) {
      const gravou = await gravar(companionId, perfil, {
        shortEn: null,
        descEn: null,
        fonte,
        estado: null,
      });
      return gravou ? 'sem-texto' : 'desatualizada';
    }

    const resultado = await traduzirParaIngles([perfil.shortDescription, perfil.description]);
    if (!resultado.ok) {
      // Ao forçar uma nova tradução de um texto que não mudou, a que existe
      // continua válida e fica.
      const desatualizada = perfil.fonte !== fonte;
      if (desatualizada && (perfil.fonte !== null || perfil.descriptionEn !== null)) {
        await gravar(companionId, perfil, { shortEn: null, descEn: null, fonte: null, estado: null });
      }
      return resultado.motivo;
    }

    const [shortEn, descEn] = resultado.textos;
    const gravou = await gravar(companionId, perfil, {
      shortEn: shortEn || null,
      descEn: descEn || null,
      fonte,
      estado: 'auto',
    });
    return gravou ? 'traduzida' : 'desatualizada';
  } catch (error) {
    console.error('garantirTraducao falhou:', error);
    return 'erro';
  }
}

/**
 * Grava uma tradução vista pelo admin. Só é aceite se o português que ele
 * viu (`fonte`) for o que está publicado; senão devolve 'desatualizada' e
 * não grava nada: a tradução seria de outro texto.
 */
export async function gravarTraducaoRevista(
  companionId: number,
  { shortEn, descEn, fonte, editada }: {
    shortEn: string;
    descEn: string;
    fonte: string;
    editada: boolean;
  },
): Promise<EstadoTraducao> {
  try {
    const [perfil] = await db
      .select({
        shortDescription: companionsTable.shortDescription,
        description: companionsTable.description,
      })
      .from(companionsTable)
      .where(eq(companionsTable.id, companionId))
      .limit(1);
    if (!perfil) return 'nao-encontrado';

    if (fonteDaTraducao(perfil.shortDescription, perfil.description) !== fonte) {
      return 'desatualizada';
    }

    const descricao = descEn.trim();
    if (!descricao) return garantirTraducao(companionId);

    const gravou = await gravar(companionId, perfil, {
      shortEn: shortEn.trim() || null,
      descEn: descricao,
      fonte,
      estado: editada ? 'revisto' : 'auto',
    });
    return gravou ? 'traduzida' : 'desatualizada';
  } catch (error) {
    console.error('gravarTraducaoRevista falhou:', error);
    return 'erro';
  }
}

/**
 * Grava a versão inglesa só se o português ainda for o que foi lido. Entre a
 * leitura e a gravação o Google pode demorar vários segundos, e uma aprovação
 * feita nesse intervalo não pode ser substituída pela tradução do texto
 * antigo. Compara os valores tal como estão na base. Devolve se gravou.
 */
async function gravar(
  companionId: number,
  lido: PortuguesLido,
  {
    shortEn,
    descEn,
    fonte,
    estado,
  }: {
    shortEn: string | null;
    descEn: string | null;
    fonte: string | null;
    estado: 'auto' | 'revisto' | null;
  },
): Promise<boolean> {
  const atualizados = await db
    .update(companionsTable)
    .set({
      shortDescriptionEn: shortEn,
      descriptionEn: descEn,
      translation_source: fonte,
      translation_status: estado,
      translated_at: estado ? new Date() : null,
    })
    .where(
      and(
        eq(companionsTable.id, companionId),
        eq(companionsTable.description, lido.description),
        lido.shortDescription === null
          ? isNull(companionsTable.shortDescription)
          : eq(companionsTable.shortDescription, lido.shortDescription),
      ),
    )
    .returning({ id: companionsTable.id });
  if (atualizados.length) refrescarPerfis();
  return atualizados.length > 0;
}
