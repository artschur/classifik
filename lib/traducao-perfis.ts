import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { db } from '@/db';
import { companionsTable, translationCacheTable } from '@/db/schema';

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
 * se volta a chamar o Google. Cada tradução feita fica também guardada em
 * translation_cache, por isso o mesmo texto nunca é pago duas vezes. A conta tem um limite diário de caracteres no
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
  /**
   * `idiomas`: o idioma que o Google detectou em cada texto ('' nos vazios).
   * Um texto que já estava em inglês volta igual ao original.
   */
  | { ok: true; textos: string[]; idiomas: string[]; caracteres: number }
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
 * Traduz para inglês. O idioma de origem não é fixado: o Google detecta-o em
 * cada texto, porque há anunciantes que escrevem em inglês (ou noutra língua)
 * e um texto já em inglês não deve ser "traduzido" como se fosse português.
 * Textos vazios voltam vazios e não são enviados. A ordem da resposta é a dos
 * textos recebidos.
 */
export async function traduzirParaIngles(
  textos: (string | null | undefined)[],
): Promise<ResultadoTraducao> {
  const chave = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!chave) return { ok: false, motivo: 'sem-chave' };

  const limpos = textos.map((t) => t?.trim() ?? '');
  const aEnviar = limpos.filter(Boolean);
  if (!aEnviar.length) {
    return { ok: true, textos: limpos, idiomas: limpos.map(() => ''), caracteres: 0 };
  }

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
      data?: {
        translations?: { translatedText?: string; detectedSourceLanguage?: string }[];
      };
    };
    const traducoes = json.data?.translations ?? [];
    if (traducoes.length !== aEnviar.length) return { ok: false, motivo: 'erro' };

    const textos: string[] = [];
    const idiomas: string[] = [];
    let i = 0;
    for (const original of limpos) {
      if (!original) {
        textos.push('');
        idiomas.push('');
        continue;
      }
      const t = traducoes[i++];
      const idioma = (t.detectedSourceLanguage ?? '').toLowerCase();
      idiomas.push(idioma);
      // Já em inglês: fica o texto dela, tal como o escreveu.
      textos.push(idioma === 'en' ? original : (t.translatedText ?? '').trim());
    }
    return { ok: true, textos, idiomas, caracteres: caracteresDe(aEnviar) };
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

/**
 * translation_status: 'auto' (tradução automática), 'revisto' (corrigida pelo
 * admin) ou 'original' (a anunciante escreveu a descrição em inglês e o texto
 * dela é usado tal como está).
 */
export type EstadoGravado = 'auto' | 'revisto' | 'original';

export type DescricoesTraduzidas =
  /** `gastos`: caracteres enviados ao Google nesta chamada (0 se veio da cache). */
  | { ok: true; shortEn: string; descEn: string; original: boolean; gastos: number }
  | { ok: false; motivo: MotivoFalha };

/**
 * Traduz as duas descrições de um perfil, passando primeiro pela cache
 * (translation_cache, chave = impressão digital do texto). O mesmo texto
 * nunca é enviado duas vezes ao Google: abrir a aba "Inglês" de um card,
 * fechar e voltar, aprovar depois de rever, ou carregar várias vezes em
 * "Traduzir os que faltam" reaproveita a tradução que já foi paga.
 * Se a cache falhar, traduz na mesma: a cache poupa, não pode impedir.
 */
export async function traduzirDescricoes(
  shortDescription: string | null | undefined,
  description: string | null | undefined,
): Promise<DescricoesTraduzidas> {
  const fonte = fonteDaTraducao(shortDescription, description);
  try {
    const [guardada] = await db
      .select()
      .from(translationCacheTable)
      .where(eq(translationCacheTable.fonte, fonte))
      .limit(1);
    if (guardada) {
      return {
        ok: true,
        shortEn: guardada.short_en ?? '',
        descEn: guardada.desc_en ?? '',
        original: guardada.original,
        gastos: 0,
      };
    }
  } catch (error) {
    console.error('Cache de traduções indisponível:', error);
  }

  const resultado = await traduzirParaIngles([shortDescription, description]);
  if (!resultado.ok) return { ok: false, motivo: resultado.motivo };

  const [shortEn, descEn] = resultado.textos;
  const original = resultado.idiomas[1] === 'en';
  try {
    await db
      .insert(translationCacheTable)
      .values({ fonte, short_en: shortEn || null, desc_en: descEn || null, original })
      .onConflictDoNothing();
  } catch (error) {
    console.error('Não foi possível guardar a tradução na cache:', error);
  }
  return { ok: true, shortEn, descEn, original, gastos: resultado.caracteres };
}

/**
 * Garante que a versão inglesa corresponde ao texto em português publicado.
 * Se já corresponder, não faz nada, a não ser que se peça `forcar` (que usa a
 * cache e por isso também não volta a pagar o mesmo texto). Se o texto mudou
 * e a tradução falhar, apaga a versão inglesa antiga: é melhor mostrar o
 * português com o aviso do que uma tradução de um texto que já não existe.
 */
export async function garantirTraducao(
  companionId: number,
  opcoes: { forcar?: boolean } = {},
): Promise<EstadoTraducao> {
  return (await garantirTraducaoComCusto(companionId, opcoes)).estado;
}

/** Como garantirTraducao, e diz quantos caracteres foram enviados ao Google. */
export async function garantirTraducaoComCusto(
  companionId: number,
  { forcar = false }: { forcar?: boolean } = {},
): Promise<{ estado: EstadoTraducao; gastos: number }> {
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
    if (!perfil) return { estado: 'nao-encontrado', gastos: 0 };

    const fonte = fonteDaTraducao(perfil.shortDescription, perfil.description);
    if (perfil.fonte === fonte && !forcar) return { estado: 'atual', gastos: 0 };

    if (!caracteresDe([perfil.shortDescription, perfil.description])) {
      const gravou = await gravar(companionId, fonte, {
        shortEn: null,
        descEn: null,
        fonte,
        estado: null,
      });
      return { estado: gravou ? 'sem-texto' : 'desatualizada', gastos: 0 };
    }

    const traducao = await traduzirDescricoes(perfil.shortDescription, perfil.description);
    if (!traducao.ok) {
      // Ao forçar uma nova tradução de um texto que não mudou, a que existe
      // continua válida e fica.
      const desatualizada = perfil.fonte !== fonte;
      if (desatualizada && (perfil.fonte !== null || perfil.descriptionEn !== null)) {
        await gravar(companionId, fonte, { shortEn: null, descEn: null, fonte: null, estado: null });
      }
      return { estado: traducao.motivo, gastos: 0 };
    }

    const gravou = await gravar(companionId, fonte, {
      shortEn: traducao.shortEn || null,
      descEn: traducao.descEn || null,
      fonte,
      estado: traducao.original ? 'original' : 'auto',
    });
    if (!gravou) console.warn(`Tradução do perfil ${companionId} não gravada: o texto mudou.`);
    return { estado: gravou ? 'traduzida' : 'desatualizada', gastos: traducao.gastos };
  } catch (error) {
    console.error('garantirTraducao falhou:', error);
    return { estado: 'erro', gastos: 0 };
  }
}

/**
 * Grava uma tradução vista pelo admin. Só é aceite se o português que ele
 * viu (`fonte`) for o que está publicado; senão devolve 'desatualizada' e
 * não grava nada: a tradução seria de outro texto.
 */
export async function gravarTraducaoRevista(
  companionId: number,
  { shortEn, descEn, fonte, editada, original = false }: {
    shortEn: string;
    descEn: string;
    fonte: string;
    editada: boolean;
    /** A descrição já estava escrita em inglês pela anunciante. */
    original?: boolean;
  },
): Promise<EstadoTraducao> {
  try {
    const descricao = descEn.trim();
    if (!descricao) return garantirTraducao(companionId);

    const gravou = await gravar(companionId, fonte, {
      shortEn: shortEn.trim() || null,
      descEn: descricao,
      fonte,
      estado: editada ? 'revisto' : original ? 'original' : 'auto',
    });
    return gravou ? 'traduzida' : 'desatualizada';
  } catch (error) {
    console.error('gravarTraducaoRevista falhou:', error);
    return 'erro';
  }
}

/**
 * Grava a versão inglesa só se o português publicado ainda for o que foi
 * traduzido (`fonteEsperada`). A verificação e a gravação correm na mesma
 * transacção, com a linha bloqueada (SELECT ... FOR UPDATE): entre a leitura
 * e a gravação o Google pode demorar segundos, e uma aprovação feita nesse
 * intervalo não pode ser substituída pela tradução do texto antigo. A
 * comparação é feita pela impressão digital, calculada da mesma forma que
 * na leitura. Devolve se gravou.
 */
async function gravar(
  companionId: number,
  fonteEsperada: string,
  {
    shortEn,
    descEn,
    fonte,
    estado,
  }: {
    shortEn: string | null;
    descEn: string | null;
    fonte: string | null;
    estado: EstadoGravado | null;
  },
): Promise<boolean> {
  const gravou = await db.transaction(async (tx) => {
    const [atual] = await tx
      .select({
        shortDescription: companionsTable.shortDescription,
        description: companionsTable.description,
      })
      .from(companionsTable)
      .where(eq(companionsTable.id, companionId))
      .for('update');
    if (!atual) return false;
    if (fonteDaTraducao(atual.shortDescription, atual.description) !== fonteEsperada) return false;

    await tx
      .update(companionsTable)
      .set({
        shortDescriptionEn: shortEn,
        descriptionEn: descEn,
        translation_source: fonte,
        translation_status: estado,
        translated_at: estado ? new Date() : null,
      })
      .where(eq(companionsTable.id, companionId));
    return true;
  });
  if (gravou) refrescarPerfis();
  return gravou;
}
