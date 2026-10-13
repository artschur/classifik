'use server';

import { auth } from '@clerk/nextjs/server';
import { eq, sql } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { characteristicsTable, citiesTable, companionsTable, imagesTable } from '@/db/schema';
import { isAdmin } from '@/components/header';
import { getSupabaseAdmin, removeStorageFolder } from '@/lib/supabase-admin';
import { importedAuthId, importedEmail } from '@/lib/imported-profiles';
import { resolveNeighborhoodId } from '@/db/queries/neighborhoods';
import { approvalSchema, consentSchema, draftSchema } from '@/lib/candidate-approval';

/**
 * Acções do separador "Importadas" do /verify, sobre staging.candidatos.
 * Todas exigem admin: este ficheiro é 'use server', e cada função exportada
 * é chamável do navegador.
 */

type Resultado = { success: true } | { success: false; error: string };

async function exigirAdmin(): Promise<string | null> {
  const { userId } = await auth();
  return userId && isAdmin(userId) ? userId : null;
}

/** Ainda na fila: nem recusada nem já transformada em perfil. */
async function lerCandidata(id: string) {
  const rows = await db.execute<{
    id: string;
    status: string;
    telefone: string;
    cidade: string | null;
    zona: string | null;
    consentimento_em: Date | null;
    companion_id: number | null;
    fotos_guardadas: string[] | null;
  }>(sql`
    select id, status, telefone, cidade, zona, consentimento_em, companion_id, fotos_guardadas
    from staging.candidatos where id = ${id}`);
  return Array.from(rows)[0] ?? null;
}

const refrescar = () => revalidatePath('/verify');

export async function markCandidateContacted(id: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { success: false, error: 'Não autorizado' };

  await db.execute(sql`
    update staging.candidatos
    set status = 'contactado', contactado_em = coalesce(contactado_em, now()), atualizado_em = now()
    where id = ${id} and status = 'candidato'`);
  refrescar();
  return { success: true };
}

/**
 * Regista que ela autorizou: quando, por onde e quem falou com ela. É a prova
 * de consentimento, e é o que destrava a aprovação.
 */
export async function registerCandidateConsent(id: string, input: unknown): Promise<Resultado> {
  const adminId = await exigirAdmin();
  if (!adminId) return { success: false, error: 'Não autorizado' };

  const parsed = consentSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Dados de consentimento inválidos' };

  const res = await db.execute(sql`
    update staging.candidatos
    set status = 'autorizado',
        contactado_em = coalesce(contactado_em, now()),
        consentimento_em = now(),
        consentimento_canal = ${parsed.data.canal},
        consentimento_notas = ${parsed.data.notas || null},
        consentimento_admin = ${adminId},
        atualizado_em = now()
    where id = ${id} and status in ('candidato', 'contactado') and companion_id is null`);
  if (!res.count) return { success: false, error: 'Candidata não encontrada ou já tratada' };

  refrescar();
  return { success: true };
}

/**
 * Guarda o perfil preparado pelo admin, sem publicar. Pode ser feito a
 * qualquer altura, antes ou depois do consentimento.
 */
export async function saveCandidateDraft(id: string, input: unknown): Promise<Resultado> {
  if (!(await exigirAdmin())) return { success: false, error: 'Não autorizado' };

  const parsed = draftSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: 'Dados do rascunho inválidos' };

  const candidata = await lerCandidata(id);
  if (!candidata || candidata.companion_id) {
    return { success: false, error: 'Candidata não encontrada ou já publicada' };
  }

  // Só fotos desta candidata: o caminho vem do navegador.
  const guardadas = new Set(candidata.fotos_guardadas ?? []);
  const rascunho = {
    ...parsed.data,
    photos: parsed.data.photos?.filter((p) => guardadas.has(p)),
  };

  await db.execute(sql`
    update staging.candidatos set rascunho = ${JSON.stringify(rascunho)}::jsonb, atualizado_em = now()
    where id = ${id}`);

  refrescar();
  return { success: true };
}

/** Disse que não: sai tudo, a linha e as fotos guardadas. */
export async function rejectCandidate(id: string): Promise<Resultado> {
  if (!(await exigirAdmin())) return { success: false, error: 'Não autorizado' };

  const candidata = await lerCandidata(id);
  if (!candidata || candidata.companion_id) {
    return { success: false, error: 'Candidata não encontrada ou já publicada' };
  }

  await removeStorageFolder('candidatas', `${id}/`);
  await db.execute(sql`delete from staging.candidatos where id = ${id} and companion_id is null`);

  refrescar();
  return { success: true };
}

/**
 * Cria o perfil e põe-o online. Só com consentimento registado.
 *
 * Ela ainda não tem conta, por isso auth_id e email ficam provisórios
 * (lib/imported-profiles), trocados pelos dela quando reclamar o perfil. O
 * perfil fica publicado mas sem selo: o selo só chega com o documento. Por
 * omissão é criado em pausa, para o admin o ver antes de o pôr no ar.
 */
export async function approveCandidate(id: string, input: unknown): Promise<Resultado> {
  if (!(await exigirAdmin())) return { success: false, error: 'Não autorizado' };

  const parsed = approvalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }
  const dados = parsed.data;

  const candidata = await lerCandidata(id);
  if (!candidata || candidata.companion_id) {
    return { success: false, error: 'Candidata não encontrada ou já publicada' };
  }
  if (candidata.status !== 'autorizado' || !candidata.consentimento_em) {
    return { success: false, error: 'Falta registar o consentimento dela' };
  }

  // Só fotos que são mesmo desta candidata, pela ordem escolhida.
  const guardadas = new Set(candidata.fotos_guardadas ?? []);
  if (!dados.photos.every((p) => guardadas.has(p))) {
    return { success: false, error: 'Há fotos que não pertencem a esta candidata' };
  }

  const [cidade] = await db
    .select({ id: citiesTable.id })
    .from(citiesTable)
    .where(eq(citiesTable.id, dados.cityId))
    .limit(1);
  if (!cidade) return { success: false, error: 'Distrito desconhecido' };

  const authId = importedAuthId(id);

  // As fotos passam do bucket privado para o público "images", na pasta do
  // perfil. Isto fica antes da escrita na base: se a cópia falhar, nada fica
  // a meio. Se a base falhar depois, as cópias são apagadas.
  const storage = getSupabaseAdmin().storage;
  const copiadas: { path: string; url: string }[] = [];
  try {
    for (const origem of dados.photos) {
      const { data: ficheiro, error: erroLer } = await storage.from('candidatas').download(origem);
      if (erroLer || !ficheiro) throw new Error('Não foi possível ler uma das fotos guardadas');

      const destino = `${authId}/${origem.split('/').pop()}`;
      const { error: erroGravar } = await storage
        .from('images')
        .upload(destino, ficheiro, { contentType: ficheiro.type || 'image/jpeg', upsert: true });
      if (erroGravar) throw new Error('Não foi possível publicar uma das fotos');

      copiadas.push({ path: destino, url: storage.from('images').getPublicUrl(destino).data.publicUrl });
    }

    await db.transaction(async (tx) => {
      const neighborhoodId = await resolveNeighborhoodId(
        tx as unknown as typeof db,
        candidata.zona || candidata.cidade,
        dados.cityId,
      );

      const [companion] = await tx
        .insert(companionsTable)
        .values({
          auth_id: authId,
          email: importedEmail(id),
          name: dados.name,
          phone: candidata.telefone,
          shortDescription: dados.shortDescription || null,
          description: dados.description,
          price: dados.price,
          age: dados.age,
          gender: 'feminino',
          languages: dados.languages,
          city_id: dados.cityId,
          neighborhood_id: neighborhoodId,
          meets_at_hotel: dados.meetsAtHotel,
          meets_at_own_place: dados.meetsAtOwnPlace,
          verified: true,
          identity_verified: false,
          paused: dados.publishPaused,
        })
        .returning({ id: companionsTable.id });

      await tx.insert(characteristicsTable).values({
        companion_id: companion.id,
        weight: String(dados.weight),
        height: String(dados.height),
        ethnicity: dados.ethnicity,
        eye_color: dados.eyeColor,
        hair_color: dados.hairColor,
      });

      await tx.insert(imagesTable).values(
        copiadas.map((foto, position) => ({
          authId,
          companionId: companion.id,
          storage_path: foto.path,
          public_url: foto.url,
          position,
        })),
      );

      await tx.execute(sql`
        update staging.candidatos
        set status = 'publicado', companion_id = ${companion.id}, atualizado_em = now()
        where id = ${id}`);
    });
  } catch (error) {
    if (copiadas.length) await storage.from('images').remove(copiadas.map((f) => f.path));
    console.error('Falha ao aprovar candidata:', error);
    const mensagem = error instanceof Error ? error.message : '';
    return {
      success: false,
      error: /duplicate key|unique/i.test(mensagem)
        ? 'Já existe um perfil com estes dados (telefone ou conta)'
        : mensagem || 'Erro ao criar o perfil',
    };
  }

  // As cópias privadas já não fazem falta: as escolhidas estão no "images".
  await removeStorageFolder('candidatas', `${id}/`);
  await db.execute(sql`update staging.candidatos set fotos_guardadas = null, rascunho = null where id = ${id}`);

  revalidateTag('companion', 'max');
  revalidateTag('companions', 'max');
  revalidateTag('companions-filter', 'max');
  refrescar();
  return { success: true };
}
