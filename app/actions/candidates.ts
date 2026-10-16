'use server';

import { auth } from '@clerk/nextjs/server';
import { asc, eq, sql } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';
import { db } from '@/db';
import { characteristicsTable, citiesTable, companionsTable, imagesTable } from '@/db/schema';
import { isAdmin } from '@/components/header';
import { getSupabaseAdmin, removeStorageFolder } from '@/lib/supabase-admin';
import { importedAuthId, importedEmail, isImportedAuthId } from '@/lib/imported-profiles';
import crypto from 'node:crypto';
import { resolveNeighborhoodId } from '@/db/queries/neighborhoods';
import { registarConsentimentoAoPublicar } from '@/db/queries/consent';
import {
  approvalSchema,
  consentSchema,
  draftSchema,
  importedEditSchema,
  telefonePT,
} from '@/lib/candidate-approval';

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
    nome_anuncio: string;
    telefone: string;
    cidade: string | null;
    zona: string | null;
    city_id: number | null;
    idade_declarada: number | null;
    consentimento_em: Date | null;
    companion_id: number | null;
    fotos_guardadas: string[] | null;
  }>(sql`
    select id, status, nome_anuncio, telefone, cidade, zona, city_id, idade_declarada,
      consentimento_em, companion_id, fotos_guardadas
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

  // Também serve depois de o perfil estar criado (em pausa): ela vê a
  // pré-visualização e autoriza. Aí o estado continua "publicado".
  const res = await db.execute(sql`
    update staging.candidatos
    set status = case when companion_id is null then 'autorizado' else status end,
        contactado_em = coalesce(contactado_em, now()),
        consentimento_em = now(),
        consentimento_canal = ${parsed.data.canal},
        consentimento_notas = ${parsed.data.notas || null},
        consentimento_admin = ${adminId},
        atualizado_em = now()
    where id = ${id} and status in ('candidato', 'contactado', 'publicado')`);
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

/**
 * Convite para ela reclamar o perfil com a conta dela: /convite/<código>.
 *
 * Só se guarda o hash do código, por isso o link não pode ser mostrado outra
 * vez: gerar um novo invalida o anterior. Válido 30 dias.
 */
export async function generateInvite(
  companionId: number,
): Promise<{ success: true; path: string } | { success: false; error: string }> {
  if (!(await exigirAdmin())) return { success: false, error: 'Não autorizado' };

  const [perfil] = await db
    .select({ authId: companionsTable.auth_id })
    .from(companionsTable)
    .where(eq(companionsTable.id, companionId))
    .limit(1);
  if (!perfil || !isImportedAuthId(perfil.authId)) {
    return { success: false, error: 'Este perfil já está ligado a uma conta' };
  }

  const codigo = crypto.randomBytes(24).toString('base64url');
  const hash = crypto.createHash('sha256').update(codigo).digest('hex');

  const res = await db.execute(sql`
    update staging.candidatos
    set convite_token_hash = ${hash}, convite_expira_em = now() + interval '30 days', atualizado_em = now()
    where companion_id = ${companionId}`);
  if (!res.count) return { success: false, error: 'Candidata deste perfil não encontrada' };

  return { success: true, path: `/convite/${codigo}` };
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
 * Cria o perfil, em pausa ou já no ar.
 *
 * Em pausa não precisa de consentimento: ninguém o encontra no site, e só
 * abre pelo link de pré-visualização que o admin lhe envia. Publicar no ar é
 * mostrar a qualquer visitante o nome, as fotos e o telefone dela: o botão
 * diz "autorizou por WhatsApp", e carregar nele é o admin a confirmar isso.
 * Fica gravado como consentimento, com a data e o admin, se ainda não houver.
 *
 * Ela ainda não tem conta, por isso auth_id e email ficam provisórios
 * (lib/imported-profiles), trocados pelos dela quando reclamar o perfil com o
 * convite. O perfil fica sem selo: o selo só chega com o documento.
 */
export async function approveCandidate(id: string, input: unknown): Promise<Resultado> {
  const adminId = await exigirAdmin();
  if (!adminId) return { success: false, error: 'Não autorizado' };

  const parsed = approvalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }
  const dados = parsed.data;

  const candidata = await lerCandidata(id);
  if (!candidata || candidata.companion_id) {
    return { success: false, error: 'Candidata não encontrada ou já publicada' };
  }

  // Só fotos que são mesmo desta candidata, pela ordem escolhida.
  const guardadas = new Set(candidata.fotos_guardadas ?? []);
  if (!dados.photos.every((p) => guardadas.has(p))) {
    return { success: false, error: 'Há fotos que não pertencem a esta candidata' };
  }

  // O que o admin deixou vazio vem do que já se sabe dela.
  const nome = dados.name || candidata.nome_anuncio.trim().slice(0, 100);
  const idade = dados.age ?? candidata.idade_declarada;
  const cityId = dados.cityId ?? candidata.city_id;
  const telefone = telefonePT(dados.phone);
  if (!idade || idade < 18) return { success: false, error: 'Falta a idade (18 ou mais)' };
  if (!cityId) return { success: false, error: 'Falta o distrito' };
  if (!telefone) return { success: false, error: 'WhatsApp inválido' };

  const [cidade] = await db
    .select({ id: citiesTable.id })
    .from(citiesTable)
    .where(eq(citiesTable.id, cityId))
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
        cityId,
      );

      const [companion] = await tx
        .insert(companionsTable)
        .values({
          auth_id: authId,
          email: importedEmail(id),
          name: nome,
          phone: telefone,
          shortDescription: dados.shortDescription || null,
          description: dados.description,
          price: dados.price ?? null,
          age: idade,
          gender: 'feminino',
          languages: dados.languages,
          city_id: cityId,
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
        weight: dados.weight != null ? String(dados.weight) : null,
        height: dados.height != null ? String(dados.height) : null,
        ethnicity: dados.ethnicity ?? null,
        eye_color: dados.eyeColor ?? null,
        hair_color: dados.hairColor ?? null,
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

      // Publicar no ar é o admin a confirmar que ela autorizou por WhatsApp.
      if (!dados.publishPaused) {
        await registarConsentimentoAoPublicar(tx as unknown as typeof db, companion.id, adminId);
      }
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

export type ImportedProfileForEdit = {
  values: {
    name: string;
    phone: string;
    age: string;
    cityId: string;
    price: string;
    ethnicity: string;
    hairColor: string;
    eyeColor: string;
    height: string;
    weight: string;
    languages: string[];
    shortDescription: string;
    description: string;
    meetsAtHotel: boolean;
    meetsAtOwnPlace: boolean;
  };
  /** Pela ordem do perfil; a primeira é a capa. */
  photos: { key: string; url: string }[];
  /** Fotos tiradas do perfil, guardadas no bucket privado. */
  archived: { key: string; url: string }[];
  cities: { id: number; city: string }[];
};

/** Fotos tiradas do perfil ficam aqui, no bucket privado, para se poderem repor. */
const pastaArquivo = (authId: string) => `${authId.slice('import_'.length)}/arquivo/`;

/** Perfil criado pelo admin e ainda sem conta dela, ou null. */
async function lerImportada(companionId: number) {
  const [perfil] = await db
    .select({ id: companionsTable.id, authId: companionsTable.auth_id })
    .from(companionsTable)
    .where(eq(companionsTable.id, companionId))
    .limit(1);
  return perfil && isImportedAuthId(perfil.authId) ? perfil : null;
}

/** Copia um ficheiro entre buckets; sem cópia directa, descarrega e envia. */
async function copiarEntreBuckets(de: string, origem: string, para: string, destino: string) {
  const storage = getSupabaseAdmin().storage;
  const { error } = await storage.from(de).copy(origem, destino, { destinationBucket: para });
  if (!error || /exists/i.test(error.message ?? '')) return;
  const { data, error: erroLer } = await storage.from(de).download(origem);
  if (erroLer || !data) throw new Error('Não foi possível ler uma das fotos');
  const { error: erroGravar } = await storage
    .from(para)
    .upload(destino, data, { contentType: data.type || 'image/jpeg', upsert: true });
  if (erroGravar) throw new Error('Não foi possível guardar uma das fotos');
}

/**
 * Dados de um perfil importado para o formulário "Editar" do admin, com as
 * fotos do perfil e as que estão no arquivo.
 */
export async function getImportedProfileForEdit(
  companionId: number,
): Promise<{ success: true; data: ImportedProfileForEdit } | { success: false; error: string }> {
  if (!(await exigirAdmin())) return { success: false, error: 'Não autorizado' };

  const perfil = await lerImportada(companionId);
  if (!perfil) return { success: false, error: 'Este perfil já está ligado a uma conta' };

  const [[c], fotos, cidades] = await Promise.all([
    db
      .select({
        name: companionsTable.name,
        phone: companionsTable.phone,
        age: companionsTable.age,
        cityId: companionsTable.city_id,
        price: companionsTable.price,
        languages: companionsTable.languages,
        shortDescription: companionsTable.shortDescription,
        description: companionsTable.description,
        meetsAtHotel: companionsTable.meets_at_hotel,
        meetsAtOwnPlace: companionsTable.meets_at_own_place,
        ethnicity: characteristicsTable.ethnicity,
        hairColor: characteristicsTable.hair_color,
        eyeColor: characteristicsTable.eye_color,
        height: characteristicsTable.height,
        weight: characteristicsTable.weight,
      })
      .from(companionsTable)
      .leftJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
      .where(eq(companionsTable.id, companionId))
      .limit(1),
    db
      .select({ path: imagesTable.storage_path, url: imagesTable.public_url })
      .from(imagesTable)
      .where(eq(imagesTable.companionId, companionId))
      .orderBy(asc(imagesTable.position), asc(imagesTable.id)),
    db.select({ id: citiesTable.id, city: citiesTable.city }).from(citiesTable).orderBy(asc(citiesTable.city)),
  ]);

  const pasta = pastaArquivo(perfil.authId);
  const storage = getSupabaseAdmin().storage.from('candidatas');
  const { data: lista } = await storage.list(pasta, { limit: 1000 });
  const caminhos = (lista ?? []).filter((f) => f.id).map((f) => `${pasta}${f.name}`);
  const { data: assinados } = caminhos.length
    ? await storage.createSignedUrls(caminhos, 60 * 60)
    : { data: [] };

  const texto = (v: unknown) => (v === null || v === undefined ? '' : String(v));

  return {
    success: true,
    data: {
      values: {
        name: c.name,
        phone: c.phone,
        age: texto(c.age),
        cityId: texto(c.cityId),
        price: texto(c.price),
        ethnicity: texto(c.ethnicity),
        hairColor: texto(c.hairColor),
        eyeColor: texto(c.eyeColor),
        height: c.height ? String(Number(c.height)) : '',
        weight: c.weight ? String(Number(c.weight)) : '',
        languages: c.languages ?? [],
        shortDescription: texto(c.shortDescription),
        description: c.description,
        meetsAtHotel: c.meetsAtHotel,
        meetsAtOwnPlace: c.meetsAtOwnPlace,
      },
      photos: fotos.map((f) => ({ key: `atual:${f.path}`, url: f.url })),
      archived: (assinados ?? [])
        .filter((a) => a.signedUrl && a.path)
        .map((a) => ({ key: `arquivo:${a.path}`, url: a.signedUrl })),
      cities: cidades,
    },
  };
}

/**
 * Grava a edição de um perfil importado: os dados e as fotos, pela ordem
 * escolhida (a primeira é a capa). Fotos tiradas vão para o arquivo privado e
 * fotos do arquivo escolhidas voltam ao perfil. Não mexe em estar no ar ou em
 * pausa, que tem botão próprio.
 */
export async function updateImportedProfile(companionId: number, input: unknown): Promise<Resultado> {
  if (!(await exigirAdmin())) return { success: false, error: 'Não autorizado' };

  const parsed = importedEditSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos' };
  }
  const dados = parsed.data;

  const perfil = await lerImportada(companionId);
  if (!perfil) return { success: false, error: 'Este perfil já está ligado a uma conta' };

  const telefone = telefonePT(dados.phone);
  if (!telefone) return { success: false, error: 'WhatsApp inválido' };

  const [cidade] = await db
    .select({ id: citiesTable.id })
    .from(citiesTable)
    .where(eq(citiesTable.id, dados.cityId))
    .limit(1);
  if (!cidade) return { success: false, error: 'Distrito desconhecido' };

  // As chaves vêm do navegador: só valem fotos deste perfil ou do arquivo dele.
  const atuais = await db
    .select({ id: imagesTable.id, path: imagesTable.storage_path })
    .from(imagesTable)
    .where(eq(imagesTable.companionId, companionId));
  const atuaisPorCaminho = new Map(atuais.map((f) => [f.path, f.id]));
  const pasta = pastaArquivo(perfil.authId);

  const escolhidas = dados.photos.map((chave) => {
    const [tipo, ...resto] = chave.split(':');
    return { tipo, caminho: resto.join(':') };
  });
  for (const f of escolhidas) {
    const valida =
      f.tipo === 'atual'
        ? atuaisPorCaminho.has(f.caminho)
        : f.caminho.startsWith(pasta) && !f.caminho.slice(pasta.length).includes('/') && !f.caminho.includes('..');
    if (!valida) return { success: false, error: 'Há fotos que não pertencem a este perfil' };
  }
  if (new Set(dados.photos).size !== dados.photos.length) {
    return { success: false, error: 'Há fotos repetidas' };
  }

  const manter = new Set(escolhidas.filter((f) => f.tipo === 'atual').map((f) => f.caminho));
  const tirar = atuais.filter((f) => !manter.has(f.path));
  const repor = escolhidas.filter((f) => f.tipo === 'arquivo');
  const storage = getSupabaseAdmin().storage;

  // Primeiro as cópias, depois a base: se uma cópia falhar, nada muda no perfil.
  const copiadasArquivo: string[] = [];
  const copiadasPerfil: { origem: string; destino: string }[] = [];
  try {
    for (const f of tirar) {
      const destino = `${pasta}${f.path.split('/').pop()}`;
      await copiarEntreBuckets('images', f.path, 'candidatas', destino);
      copiadasArquivo.push(destino);
    }
    for (const f of repor) {
      const destino = `${perfil.authId}/${f.caminho.split('/').pop()}`;
      await copiarEntreBuckets('candidatas', f.caminho, 'images', destino);
      copiadasPerfil.push({ origem: f.caminho, destino });
    }

    await db.transaction(async (tx) => {
      await tx
        .update(companionsTable)
        .set({
          name: dados.name,
          phone: telefone,
          age: dados.age,
          city_id: dados.cityId,
          price: dados.price ?? null,
          languages: dados.languages,
          shortDescription: dados.shortDescription || null,
          description: dados.description,
          meets_at_hotel: dados.meetsAtHotel,
          meets_at_own_place: dados.meetsAtOwnPlace,
          updated_at: new Date(),
        })
        .where(eq(companionsTable.id, companionId));

      const caracteristicas = {
        weight: dados.weight != null ? String(dados.weight) : null,
        height: dados.height != null ? String(dados.height) : null,
        ethnicity: dados.ethnicity ?? null,
        eye_color: dados.eyeColor ?? null,
        hair_color: dados.hairColor ?? null,
      };
      const atualizadas = await tx
        .update(characteristicsTable)
        .set(caracteristicas)
        .where(eq(characteristicsTable.companion_id, companionId))
        .returning({ id: characteristicsTable.id });
      if (!atualizadas.length) {
        await tx.insert(characteristicsTable).values({ companion_id: companionId, ...caracteristicas });
      }

      for (const f of tirar) {
        await tx.delete(imagesTable).where(eq(imagesTable.id, f.id));
      }

      const destinoDe = new Map(copiadasPerfil.map((c) => [c.origem, c.destino]));
      for (const [position, f] of escolhidas.entries()) {
        if (f.tipo === 'atual') {
          await tx.update(imagesTable).set({ position }).where(eq(imagesTable.id, atuaisPorCaminho.get(f.caminho)!));
        } else {
          const destino = destinoDe.get(f.caminho)!;
          await tx.insert(imagesTable).values({
            authId: perfil.authId,
            companionId,
            storage_path: destino,
            public_url: storage.from('images').getPublicUrl(destino).data.publicUrl,
            position,
          });
        }
      }
    });
  } catch (error) {
    // Desfaz as cópias: o perfil e o arquivo ficam como estavam.
    if (copiadasArquivo.length) await storage.from('candidatas').remove(copiadasArquivo);
    if (copiadasPerfil.length) await storage.from('images').remove(copiadasPerfil.map((c) => c.destino));
    console.error('Falha ao editar perfil importado:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Erro ao guardar' };
  }

  // Só agora sai o que mudou de sítio: as tiradas do público, as repostas do arquivo.
  if (tirar.length) await storage.from('images').remove(tirar.map((f) => f.path));
  if (copiadasPerfil.length) await storage.from('candidatas').remove(copiadasPerfil.map((c) => c.origem));

  revalidateTag('companion', 'max');
  revalidateTag('companions', 'max');
  revalidateTag('companions-filter', 'max');
  refrescar();
  return { success: true };
}
