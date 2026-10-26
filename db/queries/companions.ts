"use server";

import {
  companionsTable,
  characteristicsTable,
  citiesTable,
  NewCompanion,
  neighborhoodsTable,
  imagesTable,
  reviewsTable,
  blockedUsersTable,
  documentsTable,
  companionPendingEditsTable,
  audioRecordingsTable,
} from "../schema";
import { db } from "..";
import {
  caracteristicasParaBase,
  caracteristicasVazias,
  completarPerfilSchema,
  edicaoPerfilSchema,
  registoNovoSchema,
  type CompletarPerfilInput,
  type RegisterCompanionFormValues,
} from "@/lib/registo-schema";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/components/header";
import {
  upsertContactInRD,
  tagCompanionInRD,
  sendConversionEventToRD,
  sendConversionEventWithReason,
  RD_CONVERSION_APROVADA,
  RD_CONVERSION_APROVADA_SEM_VERIFICACAO,
  RD_CONVERSION_RECUSADA,
} from "@/lib/rd-station";
import { ZodError } from "zod";
import {
  CompanionFiltered,
  CompanionPreview,
  FilterTypesCompanions,
  Media,
  PendingChange,
} from "../../types/types";
import {
  eq,
  and,
  gte,
  lte,
  desc,
  asc,
  SQL,
  inArray,
  or,
  ilike,
  isNotNull,
  isNull,
} from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getEmail } from "./userActions";
import {
  approvePendingImages,
  discardPendingImages,
  getImagesByAuthId,
} from "./images";
import { unstable_cache, revalidateTag, revalidatePath } from "next/cache";
import { PlanType } from "./kv";
import { signDocumentUrl } from "@/lib/supabase-admin";
import { deleteAllDocumentsFromCompanion } from "@/app/actions/document-verification";
import {
  estadoVerificacao,
  resumoDocumentos,
  resumoDocumentosPorCompanion,
  temDocumentosPendentes,
  verificacaoCompletaPendente,
} from "./verificacao";
import { approvePendingAudio, discardPendingAudio } from "./audio";
import { cancelarSubscricoesNaStripe } from "./subscriptions";
import { resolveNeighborhoodId } from "./neighborhoods";
import { isImportedAuthId } from "@/lib/imported-profiles";
import { TODOS_OS_DISTRITOS } from "@/lib/districts";
import { registarConsentimentoAoPublicar } from "./consent";

/** Sem distrito (null), serve a listagem geral em /companions. */
function buildCompanionConditions(
  cityId: number | null,
  filters?: FilterTypesCompanions,
): SQL[] {
  const conditions: SQL[] = [
    eq(companionsTable.verified, true),
    eq(companionsTable.paused, false),
  ];
  if (cityId !== null) conditions.push(eq(companionsTable.city_id, cityId));

  if (filters?.search) {
    conditions.push(
      sql`LOWER(${companionsTable.name}) LIKE LOWER(${"%" + filters.search + "%"})`,
    );
  }

  if (filters?.price) {
    const [minPrice, maxPrice] = filters.price.split("-").map(Number);
    if (minPrice && maxPrice) {
      conditions.push(
        sql`${gte(companionsTable.price, minPrice)} and ${lte(companionsTable.price, maxPrice)}`,
      );
    }
  }

  if (filters?.gender) {
    const genderValue = filters.gender.toLowerCase();

    if (
      genderValue === "feminino" ||
      genderValue === "masculino" ||
      genderValue === "trans"
    ) {
      conditions.push(ilike(companionsTable.gender, genderValue));
    }
  }
  if (filters?.age) {
    const [minAge, maxAge] = filters.age.split("-").map(Number);
    if (minAge && maxAge) {
      conditions.push(
        sql`${gte(companionsTable.age, minAge)} and ${lte(companionsTable.age, maxAge)}`,
      );
    }
  }

  return conditions;
}

function buildCharacteristicConditions(filters?: FilterTypesCompanions): SQL[] {
  const conditions: SQL[] = [];

  if (filters?.height) {
    const [minHeight, maxHeight] = filters.height.split("-").map(Number);
    if (minHeight && maxHeight) {
      conditions.push(
        sql`${gte(characteristicsTable.height, (minHeight / 100).toString())} and ${lte(
          characteristicsTable.height,
          (maxHeight / 100).toString(),
        )}`,
      );
    }
  }

  if (filters?.weight) {
    const [minWeight, maxWeight] = filters.weight.split("-").map(Number);
    if (minWeight && maxWeight) {
      conditions.push(
        sql`${gte(characteristicsTable.weight, minWeight.toString())} and ${lte(
          characteristicsTable.weight,
          maxWeight.toString(),
        )}`,
      );
    }
  }

  if (filters?.hairColor) {
    const hairColors = filters.hairColor
      .split(",")
      .map((color) => color.trim().toLowerCase());
    conditions.push(
      inArray(sql`LOWER(${characteristicsTable.hair_color})`, hairColors),
    );
  }

  if (filters?.silicone)
    conditions.push(eq(characteristicsTable.silicone, true));
  if (filters?.tattoos) conditions.push(eq(characteristicsTable.tattoos, true));
  if (filters?.smoker) conditions.push(eq(characteristicsTable.smoker, true));

  return conditions;
}
function buildSortConditions(filters?: FilterTypesCompanions): SQL[] {
  const sortConditions: SQL[] = [];

  sortConditions.push(
    desc(
      sql`CASE
        WHEN ${companionsTable.has_active_ad} = true AND
             ${companionsTable.ad_expiration_date} > NOW()
        THEN 1
        ELSE 0
      END`,
    ),
  );

  if (filters?.sort) {
    switch (filters.sort) {
      // Sem preço (perfis por completar) vão sempre para o fim: por omissão o
      // Postgres põe os vazios primeiro na ordem descendente.
      case "price-asc":
        sortConditions.push(sql`${companionsTable.price} asc nulls last`);
        break;
      case "price-desc":
        sortConditions.push(sql`${companionsTable.price} desc nulls last`);
        break;
    }
  }

  return sortConditions;
}
// Function to get city ID from slug
async function getCityIdFromSlug(citySlug: string): Promise<number | null> {
  const [cityRow] = await db
    .select({ id: citiesTable.id })
    .from(citiesTable)
    .where(eq(citiesTable.slug, citySlug))
    .limit(1);

  return cityRow ? cityRow.id : null;
}

// Function to fetch companion images
async function getCompanionImages(
  companionIds: number[],
): Promise<Map<string, Media[]>> {
  if (companionIds.length === 0) return new Map();

  const images = await db
    .select({
      companionId: imagesTable.companionId,
      public_url: imagesTable.public_url,
      focal_x: imagesTable.focal_x,
      focal_y: imagesTable.focal_y,
      zoom: imagesTable.zoom,
    })
    .from(imagesTable)
    .where(
      and(
        inArray(imagesTable.companionId, companionIds),
        // Fotos de uma edição por rever não entram nas listagens: o que está
        // no ar continua a ser o conjunto aprovado.
        eq(imagesTable.pending_approval, false),
      ),
    )
    .orderBy(asc(imagesTable.position), asc(imagesTable.id));

  return images.reduce((acc, img) => {
    if (!acc.has(img.companionId.toString())) {
      acc.set(img.companionId.toString(), []);
    }
    acc.get(img.companionId.toString())!.push({
      publicUrl: img.public_url,
      focalX: img.focal_x,
      focalY: img.focal_y,
      zoom: img.zoom,
    });
    return acc;
  }, new Map<string, Media[]>());
}

// Function to build the base companions query
function buildCompanionsQuery(
  cityId: number | null,
  companionConditions: SQL[],
  characteristicConditions: SQL[],
  sortConditions: SQL[],
) {
  const allConditions = [
    ...companionConditions,
    ...characteristicConditions,
  ].filter(Boolean);

  return db
    .select({
      companion: {
        id: companionsTable.id,
        name: companionsTable.name,
        shortDescription: companionsTable.shortDescription,
        price: companionsTable.price,
        age: companionsTable.age,
        verified: companionsTable.verified,
        identityVerified: companionsTable.identity_verified,
        hasActiveAd: sql<boolean>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.has_active_ad} ELSE false END`.as('hasActiveAd'),
        planType: sql<string>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.plan_type} ELSE 'free' END`.as('planType'),
      },
      city: {
        name: citiesTable.city,
      },
      characteristics: {
        weight: characteristicsTable.weight,
        height: characteristicsTable.height,
        ethnicity: characteristicsTable.ethnicity,
        eye_color: characteristicsTable.eye_color,
        hair_color: characteristicsTable.hair_color,
        silicone: characteristicsTable.silicone,
        tattoos: characteristicsTable.tattoos,
        piercings: characteristicsTable.piercings,
        smoker: characteristicsTable.smoker,
      },
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id),
    )
    .where(and(...allConditions))
    .orderBy(
      ...(sortConditions
        ? sortConditions
        : [
          desc(
            sql`CASE
              WHEN ${companionsTable.has_active_ad} = true AND
                   ${companionsTable.ad_expiration_date} > NOW()
              THEN 1
              ELSE 0
            END`,
          ),
          desc(
            sql`CASE
                WHEN ${companionsTable.plan_type} = 'vip' THEN 3
                WHEN ${companionsTable.plan_type} = 'plus' THEN 2
                WHEN ${companionsTable.plan_type} = 'classic' THEN 1
                ELSE 0
              END`,
          ),
          desc(companionsTable.id),
        ]),
    );
}

export async function getDoDiaCompanion() {
  const results = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      age: companionsTable.age,
      price: companionsTable.price,
      shortDescription: companionsTable.shortDescription,
      verified: companionsTable.verified,
      identityVerified: companionsTable.identity_verified,
      city: citiesTable.city,
      imageUrl: imagesTable.public_url,
      focalX: imagesTable.focal_x,
      focalY: imagesTable.focal_y,
      zoom: imagesTable.zoom,
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .leftJoin(
      imagesTable,
      and(
        eq(imagesTable.companionId, companionsTable.id),
        eq(imagesTable.is_verification_video, false),
      ),
    )
    .where(
      and(
        eq(companionsTable.is_sugar_of_day, true),
        eq(companionsTable.verified, true),
        eq(companionsTable.paused, false),
        // O destaque é só para VIP. Se o VIP expirar, ela sai do hero sozinha
        // em vez de lá ficar de graça até alguém reparar.
        eq(companionsTable.plan_type, 'vip'),
        sql`${companionsTable.ad_expiration_date} > NOW()`,
      ),
    )
    // Com o limit(1) sobre o join, sem ordenar saía uma foto qualquer do
    // perfil em vez da capa escolhida.
    .orderBy(asc(imagesTable.position), asc(imagesTable.id))
    .limit(1);

  if (!results.length) return null;
  const row = results[0];
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    price: row.price,
    shortDescription: row.shortDescription,
    verified: row.verified,
    identityVerified: row.identityVerified,
    city: row.city,
    imageUrl: row.imageUrl,
    focalX: row.focalX,
    focalY: row.focalY,
    zoom: row.zoom,
  };
}

export async function getRandomCompanions(
  plans?: PlanType[],
  citySlug?: string,
): Promise<CompanionPreview[]> {
  const conditions: SQL[] = [
    eq(companionsTable.verified, true),
    eq(companionsTable.paused, false),
  ];
  if (plans) {
    conditions.push(inArray(companionsTable.plan_type, plans!));
    // Sem isto, uma sugar cujo plano VIP/Plus já expirou continuava a
    // aparecer no carrossel "VIP" para sempre, porque o plan_type gravado só
    // é actualizado quando um webhook de assinatura chega, e compras avulsas
    // nunca disparam esse evento.
    conditions.push(sql`${companionsTable.ad_expiration_date} > NOW()`);
  }
  if (citySlug) {
    conditions.push(eq(citiesTable.slug, citySlug));
  }

  const planTypeOrder = sql`
    CASE
      WHEN ${companionsTable.ad_expiration_date} <= NOW() THEN 1
      WHEN ${companionsTable.plan_type} = 'free' THEN 1
      WHEN ${companionsTable.plan_type} = 'classic' THEN 2
      WHEN ${companionsTable.plan_type} = 'plus' THEN 3
      WHEN ${companionsTable.plan_type} = 'vip' THEN 4
      ELSE 0
    END DESC
  `;

  const results = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      age: companionsTable.age,
      price: companionsTable.price,
      city: citiesTable.city,
      mainImageUrl: imagesTable.public_url,
      mainImageFocalX: imagesTable.focal_x,
      mainImageFocalY: imagesTable.focal_y,
      mainImageZoom: imagesTable.zoom,
      planType: sql<string>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.plan_type} ELSE 'free' END`.as('planType'),
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    // O join fica limitado à capa de cada perfil. Antes trazia todas as fotos,
    // o que multiplicava as linhas: o limit(10) contava linhas e não perfis, e
    // a foto que sobrava do de-duplicar era aleatória.
    .leftJoin(
      imagesTable,
      and(
        eq(imagesTable.companionId, companionsTable.id),
        sql`${imagesTable.id} = (
          SELECT capa."id" FROM "images" capa
          WHERE capa."companion_id" = ${companionsTable.id}
            AND capa."is_verification_video" = false
          ORDER BY capa."position" ASC, capa."id" ASC
          LIMIT 1
        )`,
      ),
    )
    .where(and(...conditions))
    .orderBy(planTypeOrder, sql`RANDOM()`, companionsTable.id)
    .limit(10);

  return results.map((row) => ({
    id: row.id,
    name: row.name,
    age: row.age,
    price: row.price,
    city: row.city,
    images: row.mainImageUrl
      ? [
        {
          publicUrl: row.mainImageUrl,
          focalX: row.mainImageFocalX ?? 50,
          focalY: row.mainImageFocalY ?? 50,
          zoom: row.mainImageZoom ?? 100,
        },
      ]
      : [],
    planType: row.planType,
  }));
}

/**
 * Perfis no ar, só o que o mapa do site precisa: o identificador e a data da
 * última alteração. Sem cache de longa duração de propósito — o mapa existe
 * para o buscador saber que há uma acompanhante nova, e servir-lhe uma lista
 * de há meia hora atrasa justamente aquilo que ele vem buscar.
 */
export async function getSitemapCompanions(): Promise<
  { id: number; updatedAt: Date | null; }[]
> {
  return db
    .select({
      id: companionsTable.id,
      updatedAt: companionsTable.updated_at,
    })
    .from(companionsTable)
    .where(
      and(eq(companionsTable.verified, true), eq(companionsTable.paused, false)),
    )
    .orderBy(asc(companionsTable.id));
}

/**
 * Distrito de um perfil (nome na base e slug), para o título, o breadcrumb e
 * os dados estruturados da página do perfil.
 *
 * O título só com o nome repetia-se entre perfis com o mesmo nome (duas
 * "Bianca" tinham exactamente o mesmo título) e não dizia ao buscador onde a
 * acompanhante está. O slug serve para ligar o perfil de volta à página do
 * distrito. Devolve null se o perfil não tiver distrito.
 */
export async function getCompanionDistrict(
  companionId: number,
): Promise<{ city: string; slug: string } | null> {
  const [row] = await db
    .select({ city: citiesTable.city, slug: citiesTable.slug })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .where(eq(companionsTable.id, companionId))
    .limit(1);

  return row ?? null;
}

/**
 * Todas as acompanhantes no ar, para a listagem geral em /companions.
 *
 * Existe porque o buscador não encontrava caminho nenhum até aos perfis: a
 * lista dos distritos é desenhada no navegador, por isso o código que o
 * servidor entrega não tem uma única ligação para /companions/<id>. Esta
 * consulta alimenta uma página desenhada no servidor, com as ligações já no
 * HTML e paginação por endereço.
 *
 * A ordem termina no id de propósito: sem desempate estável, a mesma
 * acompanhante podia aparecer em duas páginas ou em nenhuma.
 */
export const getAllActiveCompanions = unstable_cache(
  async (
    page: number,
    pageSize: number,
    // Os mesmos filtros, ordenação e procura por nome das páginas de distrito.
    filters?: FilterTypesCompanions,
  ): Promise<{ companions: CompanionPreview[]; total: number; }> => {
    // Até ao limite que a página usa: o tamanho vem também do navegador.
    pageSize = Math.min(Math.max(1, Math.floor(pageSize) || 24), 48);
    const offset = (page - 1) * pageSize;

    // left join: um perfil sem linha de características continua na lista
    // enquanto não houver filtro de características.
    const onde = and(
      ...buildCompanionConditions(null, filters),
      ...buildCharacteristicConditions(filters),
    );
    const ordemPreco =
      filters?.sort === "price-asc"
        ? [sql`${companionsTable.price} asc nulls last`]
        : filters?.sort === "price-desc"
          ? [sql`${companionsTable.price} desc nulls last`]
          : [];

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(companionsTable)
      .leftJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
      .where(onde);

    if (total === 0) return { companions: [], total: 0 };

    const rows = await db
      .select({
        id: companionsTable.id,
        name: companionsTable.name,
        age: companionsTable.age,
        price: companionsTable.price,
        shortDescription: companionsTable.shortDescription,
        city: citiesTable.city,
        planType: sql<string>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.plan_type} ELSE 'free' END`.as(
          'planType',
        ),
        planRank: sql<number>`CASE
          WHEN ${companionsTable.ad_expiration_date} <= NOW() OR ${companionsTable.ad_expiration_date} IS NULL THEN 3
          WHEN ${companionsTable.plan_type} = 'vip' THEN 0
          WHEN ${companionsTable.plan_type} = 'plus' THEN 1
          WHEN ${companionsTable.plan_type} = 'classic' THEN 2
          ELSE 3 END`.as('planRank'),
      })
      .from(companionsTable)
      .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
      .leftJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
      .where(onde)
      .orderBy(sql`"planRank" asc`, ...ordemPreco, asc(companionsTable.id))
      .limit(pageSize)
      .offset(offset);

    if (rows.length === 0) return { companions: [], total };

    const imagesMap = await getCompanionImages(rows.map((r) => r.id));

    return {
      companions: rows.map((row) => ({
        id: row.id,
        name: row.name,
        age: row.age,
        price: row.price,
        shortDescription: row.shortDescription,
        city: row.city,
        planType: row.planType,
        images: imagesMap.get(String(row.id)) || [],
      })) as unknown as CompanionPreview[],
      total,
    };
  },
  ["companions-all"],
  { revalidate: 1800, tags: ["companions", "companions-filter"] },
);

export const getCompanionsToFilter = unstable_cache(
  async (
    citySlug: string,
    page: number,
    filters?: FilterTypesCompanions,
  ): Promise<CompanionFiltered[]> => {
    const pageSize = 9;
    const offset = (page - 1) * pageSize;

    // "portugal" é a listagem geral (/companions): todos os distritos.
    const cityId =
      citySlug === TODOS_OS_DISTRITOS ? null : await getCityIdFromSlug(citySlug);
    // Slug que não é distrito nenhum: lista vazia, como antes.
    if (cityId === null && citySlug !== TODOS_OS_DISTRITOS) return [];

    // Build query conditions
    const companionConditions = buildCompanionConditions(cityId, filters);
    const characteristicConditions = buildCharacteristicConditions(filters);
    const sortConditions = buildSortConditions(filters);

    // Create the base query
    const query = buildCompanionsQuery(
      cityId,
      companionConditions,
      characteristicConditions,
      sortConditions,
    );

    // Execute the paginated query to get companions
    const results = await query.limit(pageSize).offset(offset);
    if (results.length === 0) return [];

    // Get companion IDs for fetching related data
    const companionIds = results.map((r) => r.companion.id);

    // Fetch images in parallel with any other potential data fetches
    const imagesMap = await getCompanionImages(companionIds);

    // Map the results to the expected output format
    const planOrder: Record<string, number> = {
      vip: 0,
      plus: 1,
      classic: 2,
      free: 3,
    };
    const output = results
      .map(({ companion, city, characteristics }) => ({
        ...companion,
        city: city.name,
        weight: characteristics.weight,
        height: characteristics.height,
        eyeColor: characteristics.eye_color,
        hairColor: characteristics.hair_color,
        silicone: characteristics.silicone,
        tattoos: characteristics.tattoos,
        piercings: characteristics.piercings,
        smoker: characteristics.smoker,
        ethinicity: characteristics.ethnicity,
        planType: companion.planType,
        images: imagesMap.get(String(companion.id)) || [],
      }))
      .sort((a, b) => {
        const aPlan = (a.planType || "").toLowerCase();
        const bPlan = (b.planType || "").toLowerCase();
        return (planOrder[aPlan] ?? 999) - (planOrder[bPlan] ?? 999);
      });
    return output;
  },
  ["companions-filter"],
  {
    revalidate: 1800,
    tags: ["companions", "companions-filter"],
  },
);

/** A primeira mensagem de um erro de validação, para mostrar a quem preenche. */
function mensagemDeValidacao(error: unknown): string | null {
  return error instanceof ZodError ? (error.issues[0]?.message ?? "Dados inválidos") : null;
}

/**
 * Cria o perfil no primeiro upload de foto (passo 3 do registo), já na fila do
 * admin. Leva só os passos 1 e 2: o resto (passo 5) é opcional e vem depois.
 *
 * A conta e o email saem da sessão, nunca do pedido: este ficheiro é 'use
 * server', e com os dois como parâmetros dava para criar um perfil em nome de
 * outra conta.
 */
export async function registerCompanion(companionData: RegisterCompanionFormValues) {
  const { userId: clerkId, sessionClaims } = await auth();
  if (!clerkId) {
    throw new Error("Sessão expirada. Entre outra vez.");
  }

  let dados;
  try {
    dados = registoNovoSchema.parse(companionData);
  } catch (error) {
    throw new Error(mensagemDeValidacao(error) ?? "Dados inválidos");
  }

  let email = sessionClaims?.email;
  if (!email) {
    const cc = await clerkClient();
    const user = await cc.users.getUser(clerkId);
    email =
      user.emailAddresses?.find((e) => e.id === user.primaryEmailAddressId)?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress;
  }
  if (!email) {
    throw new Error("A conta não tem email associado.");
  }

  try {
    const agora = new Date();
    const newCompanion = await db.transaction(async (tx) => {
      const neighborhoodId = await resolveNeighborhoodId(
        tx as unknown as typeof db,
        dados.neighborhood,
        dados.city,
      );

      const [companion] = await tx
        .insert(companionsTable)
        .values({
          auth_id: clerkId,
          name: dados.name,
          email,
          phone: dados.phoneNumber,
          description: dados.description,
          price: dados.price,
          age: dados.age,
          gender: dados.gender,
          city_id: dados.city,
          neighborhood_id: neighborhoodId,
          meets_at_hotel: dados.meets_at_hotel,
          meets_at_own_place: dados.meets_at_own_place,
          // Entra logo na fila do admin, com ou sem verificação.
          submitted_at: agora,
          terms_accepted_at: agora,
        })
        .returning({ id: companionsTable.id });

      // A linha fica vazia até ao passo 5, mas tem de existir: as listagens
      // e a fila juntam-se a esta tabela.
      await tx.insert(characteristicsTable).values({ companion_id: companion.id });

      return companion;
    });

    // O contacto já foi para o RD quando ela passou a primeira etapa do
    // formulário, que é bem antes de chegar aqui. Repetir o envio neste ponto
    // era uma segunda chamada com exactamente os mesmos dados. Quem trata
    // disso, incluindo repetir se a primeira tentativa falhou, é o formulário
    // (syncRegistrationContact em components/formCompanionRegister.tsx).

    return JSON.parse(JSON.stringify(newCompanion));
  } catch (error) {
    console.error("Failed to register companion in DB:", error);
    // Re-throw a more specific error
    throw new Error(
      `Database operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function getRelevantInfoAnalytics({
  clerkId,
}: {
  clerkId: string;
}) {
  const [companion] = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      plan: sql<string>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.plan_type} ELSE 'free' END`.as('plan'),
      stripeCustomerId: companionsTable.stripe_customer_id,
      isPaying: companionsTable.has_active_ad,
      paused: companionsTable.paused,
      interactions: sql<number>`COALESCE(CAST(COUNT(CASE WHEN ${reviewsTable.liked_by} IS NOT NULL THEN 1 END) AS INTEGER), 0)`,
      averageRating: sql<number>`COALESCE(avg(${reviewsTable.rating}), 0)`,
    })
    .from(companionsTable)
    .leftJoin(reviewsTable, eq(reviewsTable.companion_id, companionsTable.id))
    .where(eq(companionsTable.auth_id, clerkId))
    .groupBy(companionsTable.id, companionsTable.name) // Include name in GROUP BY
    .limit(1);

  if (!companion) {
    return {
      id: 0,
      name: "Usuário",
      paused: false,
      interactions: 0,
      averageRating: 0,
    };
  }

  return {
    id: companion.id,
    name: companion.name,
    plan: companion.plan,
    stripeCustomerId: companion.stripeCustomerId,
    isPaying: companion.isPaying,
    paused: companion.paused,
    interactions: companion.interactions,
    averageRating: Number(companion.averageRating).toFixed(1),
  };
}

export async function getCompanionNameByClerkId(
  clerkId: string,
): Promise<{ name: string; id: number }> {
  const [companion] = await db
    .select({
      name: companionsTable.name,
      id: companionsTable.id,
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);
  if (!companion) {
    throw new Error("Companion not found");
  }
  return {
    name: companion.name,
    id: companion.id,
  };
}

export async function isUserACompanion(clerkId: string): Promise<boolean> {
  const companion = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);

  return companion.length > 0;
}

export async function getCompanionByClerkId(
  clerkId: string,
): Promise<CompanionFiltered> {
  const query = db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      shortDescription: companionsTable.shortDescription,
      price: companionsTable.price,
      age: companionsTable.age,
      ethinicity: characteristicsTable.ethnicity,
      city: citiesTable.city,
      weight: characteristicsTable.weight,
      height: characteristicsTable.height,
      eyeColor: characteristicsTable.eye_color,
      hairColor: characteristicsTable.hair_color,
      silicone: characteristicsTable.silicone,
      tattoos: characteristicsTable.tattoos,
      piercings: characteristicsTable.piercings,
      smoker: characteristicsTable.smoker,
      verified: companionsTable.verified,
      planType: sql<string>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.plan_type} ELSE 'free' END`.as('planType'),
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1)
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id),
    )
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id));

  const [response, images] = await Promise.all([
    query,
    getImagesByAuthId(clerkId),
  ]);

  return {
    ...response[0],
    images: images.map((image) => ({
      publicUrl: image.publicUrl,
      focalX: image.focalX,
      focalY: image.focalY,
      zoom: image.zoom,
    })),
  };
}

export async function getCompanionToEdit(
  clerkId: string,
): Promise<(RegisterCompanionFormValues & { companionId: number }) | null> {
  // Fetch companion base data
  const [companion] = await db
    .select({
      companionId: companionsTable.id,
      name: companionsTable.name,
      shortDescription: companionsTable.shortDescription,
      phoneNumber: companionsTable.phone,
      instagramHandle: companionsTable.instagramHandle,
      description: companionsTable.description,
      price: companionsTable.price,
      age: companionsTable.age,
      gender: companionsTable.gender,
      gender_identity: companionsTable.gender_identity,
      languages: companionsTable.languages,
      city: companionsTable.city_id,
      neighborhoodId: companionsTable.neighborhood_id,
      meets_at_hotel: companionsTable.meets_at_hotel,
      meets_at_own_place: companionsTable.meets_at_own_place,
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);

  if (!companion) return null;

  const [characteristics, cityInfo, neighborhood] = await Promise.all([
    db
      .select({
        weight: characteristicsTable.weight,
        height: characteristicsTable.height,
        ethnicity: characteristicsTable.ethnicity,
        eye_color: characteristicsTable.eye_color,
        hair_color: characteristicsTable.hair_color,
        hair_length: characteristicsTable.hair_length,
        shoe_size: characteristicsTable.shoe_size,
        silicone: characteristicsTable.silicone,
        tattoos: characteristicsTable.tattoos,
        piercings: characteristicsTable.piercings,
        smoker: characteristicsTable.smoker,
      })
      .from(characteristicsTable)
      .where(eq(characteristicsTable.companion_id, companion.companionId))
      .limit(1),

    db
      .select({
        state: citiesTable.state,
        country: citiesTable.country,
      })
      .from(citiesTable)
      .where(eq(citiesTable.id, companion.city))
      .limit(1),

    // Antes isto comparava o id do concelho com o id da companion, dois
    // números sem qualquer relação, por isso o campo voltava sempre vazio.
    companion.neighborhoodId
      ? db
        .select({
          neighborhood: neighborhoodsTable.neighborhood,
        })
        .from(neighborhoodsTable)
        .where(eq(neighborhoodsTable.id, companion.neighborhoodId))
        .limit(1)
      : Promise.resolve([]),
  ]);

  const row = {
    ...companion,
    ...characteristics[0],
    ...cityInfo[0],
    ...neighborhood[0],
  };

  if (!row) {
    return null;
  }

  // Se ela já guardou alterações que estão à espera de revisão, é isso que
  // tem de reaparecer no formulário. Mostrar a versão publicada dava a
  // sensação de que o que escreveu se tinha perdido.
  const [pendingEdit] = await db
    .select({ payload: companionPendingEditsTable.payload })
    .from(companionPendingEditsTable)
    .where(eq(companionPendingEditsTable.companion_id, companion.companionId))
    .limit(1);

  const published = {
    companionId: row.companionId,
    name: row.name ?? "",
    shortDescription: row.shortDescription ?? "",
    phoneNumber:
      row.phoneNumber && !row.phoneNumber.startsWith("+")
        ? `+${row.phoneNumber}`
        : (row.phoneNumber ?? ""),
    instagramHandle: row.instagramHandle ?? "",
    description: row.description ?? "",
    price: row.price ?? 0,
    age: row.age ?? 0,
    gender: row.gender ?? "",
    gender_identity: row.gender_identity ?? "",
    languages: row.languages ?? [],
    // As características são opcionais (passo 5): o que falta chega vazio ao
    // formulário, e não com um valor inventado que ficava gravado.
    weight: row.weight ? Number(row.weight) : undefined,
    height: row.height ? Number(row.height) : undefined,
    ethnicity: row.ethnicity ?? "",
    eye_color: row.eye_color ?? "",
    hair_color: row.hair_color ?? "",
    hair_length: row.hair_length ?? "",
    shoe_size: row.shoe_size ?? undefined,
    silicone: row.silicone ?? false,
    tattoos: row.tattoos ?? false,
    piercings: row.piercings ?? false,
    smoker: row.smoker ?? false,

    city: row.city ?? 1,
    state: row.state ?? "",
    country: row.country ?? "",
    neighborhood: row.neighborhood ?? "",
    meets_at_hotel: row.meets_at_hotel ?? false,
    meets_at_own_place: row.meets_at_own_place ?? false,
  };

  if (!pendingEdit) return published;

  return {
    ...published,
    ...(pendingEdit.payload as Partial<RegisterCompanionFormValues>),
    companionId: published.companionId,
  };
}

/**
 * Grava as características, com o que não foi preenchido a null. Se a linha
 * não existir (não devia, a criação do perfil já a insere), cria-a: sem ela o
 * perfil desaparecia das listagens, que se juntam a esta tabela.
 */
async function gravarCaracteristicas(
  executor: typeof db,
  companionId: number,
  data: Partial<CompletarPerfilInput>,
) {
  const valores = caracteristicasParaBase(data);
  const atualizadas = await executor
    .update(characteristicsTable)
    .set(valores)
    .where(eq(characteristicsTable.companion_id, companionId))
    .returning({ id: characteristicsTable.id });
  if (!atualizadas.length) {
    await executor.insert(characteristicsTable).values({ companion_id: companionId, ...valores });
  }
}

/**
 * Escreve mesmo os valores do formulário no perfil. É o caminho usado tanto
 * por quem ainda não foi aprovada (que não tem nada no ar a proteger) como
 * pela aprovação de uma edição que esteve à espera.
 *
 * Não mexe no `verified` de propósito: quem decide isso é quem chama.
 */
async function applyCompanionFormValues(
  companionId: number,
  data: RegisterCompanionFormValues,
) {
  let email: string | undefined;

  await db.transaction(async (tx) => {
    const neighborhoodId = await resolveNeighborhoodId(
      tx as unknown as typeof db,
      data.neighborhood,
      data.city,
    );

    const [companion] = await tx
      .update(companionsTable)
      .set({
        name: data.name,
        phone: data.phoneNumber,
        shortDescription: data.shortDescription || null,
        description: data.description,
        instagramHandle: data.instagramHandle || null,
        price: data.price,
        age: data.age,
        gender: data.gender,
        gender_identity: data.gender_identity || null,
        languages: data.languages ?? [],
        city_id: data.city,
        neighborhood_id: neighborhoodId,
        meets_at_hotel: data.meets_at_hotel,
        meets_at_own_place: data.meets_at_own_place,
        updated_at: new Date(),
      } as NewCompanion)
      .where(eq(companionsTable.id, companionId))
      .returning({ email: companionsTable.email });

    email = companion?.email;

    await gravarCaracteristicas(tx as unknown as typeof db, companionId, data);
  });

  // Só depois de os valores serem mesmo os publicados é que o CRM é
  // actualizado: enquanto a edição está à espera, o nome e o telefone que
  // valem continuam a ser os aprovados.
  if (email) {
    await upsertContactInRD({ email, name: data.name, phone: data.phoneNumber });
  }
}

/**
 * Guarda uma edição de perfil.
 *
 * Quem já foi aprovada não sai do ar por editar: a proposta fica guardada à
 * parte e o site continua a mostrar a versão aprovada até um admin a rever.
 * Quem ainda não passou pela verificação grava directamente, porque não há
 * versão publicada nenhuma para proteger.
 */
export async function updateCompanionFromForm(
  data: RegisterCompanionFormValues,
): Promise<{ pendingReview: boolean; reenviado: boolean; }> {
  // A conta sai da sessão, nunca do pedido: o id da conta aparece no
  // endereço das fotos públicas, e com ele qualquer pessoa alterava o perfil
  // de outra (o telefone de um registo por aprovar, por exemplo).
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Sessão expirada. Entre outra vez.");
  }

  let dados;
  try {
    dados = edicaoPerfilSchema.parse(data);
  } catch (error) {
    throw new Error(mensagemDeValidacao(error) ?? "Dados inválidos");
  }

  const companion = await perfilDaSessao(clerkId);

  if (!companion.verified) {
    await applyCompanionFormValues(companion.id, dados);
    const reenviado = await reenviarSeRecusado(companion);
    // Só ela (e o admin) vêem o perfil por aprovar, mas a pré-visualização
    // dela lê da cache.
    revalidateTag("companion", "max");
    return { pendingReview: false, reenviado };
  }

  await guardarEdicaoPendente(companion.id, dados);
  return { pendingReview: true, reenviado: false };
}

/**
 * Passo 5 do registo (e o separador equivalente da edição): descrição curta,
 * Instagram, identidade de género, línguas e características. Tudo opcional.
 *
 * Por aprovar, grava directo e o admin vê logo na fila. Já no ar, passa pela
 * revisão como qualquer outra edição: junta-se à que estiver à espera ou parte
 * do que está publicado.
 */
export async function saveCompletarPerfil(
  input: CompletarPerfilInput,
): Promise<{ pendingReview: boolean; }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) {
    throw new Error("Sessão expirada. Entre outra vez.");
  }

  let dados;
  try {
    dados = completarPerfilSchema.parse(input);
  } catch (error) {
    throw new Error(mensagemDeValidacao(error) ?? "Dados inválidos");
  }

  const companion = await perfilDaSessao(clerkId);

  if (!companion.verified) {
    await db.transaction(async (tx) => {
      await tx
        .update(companionsTable)
        .set({
          shortDescription: dados.shortDescription || null,
          instagramHandle: dados.instagramHandle || null,
          gender_identity: dados.gender_identity || null,
          languages: dados.languages,
          updated_at: new Date(),
        })
        .where(eq(companionsTable.id, companion.id));
      await gravarCaracteristicas(tx as unknown as typeof db, companion.id, dados);
    });
    await reenviarSeRecusado(companion);
    revalidateTag("companion", "max");
    return { pendingReview: false };
  }

  const atual = await getCompanionToEdit(clerkId);
  if (!atual) {
    throw new Error("Perfil não encontrado");
  }
  const { companionId: _id, ...publicado } = atual;
  await guardarEdicaoPendente(companion.id, { ...publicado, ...dados });
  return { pendingReview: true };
}

/** O perfil de quem está com sessão iniciada, com o estado que as gravações precisam. */
async function perfilDaSessao(clerkId: string) {
  const [companion] = await db
    .select({
      id: companionsTable.id,
      verified: companionsTable.verified,
      rejectedAt: companionsTable.rejected_at,
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);

  if (!companion) {
    throw new Error("Perfil não encontrado");
  }
  return companion;
}

/**
 * Um perfil recusado que ela corrige volta à fila do admin. O motivo antigo
 * fica gravado, para o admin saber porque foi recusado da última vez.
 */
async function reenviarSeRecusado(companion: { id: number; rejectedAt: Date | null; }) {
  if (!companion.rejectedAt) return false;
  await db
    .update(companionsTable)
    .set({ rejected_at: null, submitted_at: new Date(), updated_at: new Date() })
    .where(eq(companionsTable.id, companion.id));
  return true;
}

/**
 * Guarda a proposta de um perfil que já está no ar. Os campos vazios ficam a
 * null, e não de fora: sem isso, apagar um valor não aparecia como alteração
 * no ecrã do admin, embora fosse aplicado ao aprovar.
 */
async function guardarEdicaoPendente(
  companionId: number,
  dados: Partial<RegisterCompanionFormValues>,
) {
  const payload = JSON.parse(
    JSON.stringify(dados, (_chave, valor) => (valor === undefined ? null : valor)),
  ) as Record<string, unknown>;

  await db
    .insert(companionPendingEditsTable)
    .values({ companion_id: companionId, payload })
    .onConflictDoUpdate({
      target: companionPendingEditsTable.companion_id,
      set: { payload, updated_at: new Date() },
    });
}

/**
 * Perfis que já estavam aprovados antes da desverificação em massa e que, por
 * não terem documentos, ficariam invisíveis na fila e sem forma de voltarem ao
 * ar pela interface. Entram uma vez para poderem ser reaprovados, e a aprovação
 * tira-os da fila sozinha.
 *
 * A tabela é um artefacto temporário dessa operação, por isso a leitura é
 * tolerante: se ela for apagada, a lista fica vazia e volta a valer só a regra
 * normal de exigir documento.
 */
async function getLegacyApprovedIds(): Promise<number[]> {
  try {
    const rows = await db.execute<{ id: number; }>(
      sql`SELECT id FROM companions_verified_backup`,
    );
    return Array.from(rows as Iterable<{ id: number; }>).map((row) =>
      Number(row.id),
    );
  } catch {
    return [];
  }
}

/** Campos comparados no ecrã de revisão, pela ordem em que são mostrados. */
const EDIT_DIFF_FIELDS: { key: keyof RegisterCompanionFormValues; label: string; }[] =
  [
    { key: "name", label: "Nome" },
    { key: "age", label: "Idade" },
    { key: "price", label: "Preço" },
    { key: "phoneNumber", label: "Telemóvel" },
    { key: "instagramHandle", label: "Instagram" },
    { key: "shortDescription", label: "Descrição curta" },
    { key: "description", label: "Descrição" },
    { key: "languages", label: "Línguas" },
    { key: "gender", label: "Género" },
    { key: "gender_identity", label: "Identidade de género" },
    { key: "weight", label: "Peso" },
    { key: "height", label: "Altura" },
    { key: "ethnicity", label: "Etnia" },
    { key: "eye_color", label: "Cor dos olhos" },
    { key: "hair_color", label: "Cor do cabelo" },
    { key: "hair_length", label: "Comprimento do cabelo" },
    { key: "shoe_size", label: "Número de calçado" },
    { key: "silicone", label: "Silicone" },
    { key: "tattoos", label: "Tatuagens" },
    { key: "piercings", label: "Piercings" },
    { key: "smoker", label: "Fumadora" },
    { key: "meets_at_hotel", label: "Atende em hotel" },
    { key: "meets_at_own_place", label: "Atende em local próprio" },
  ];

function describeValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "(vazio)";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

/**
 * Compara o que está publicado com o que foi proposto. Números passam pela
 * comparação numérica porque a base devolve-os como texto: sem isso, "1.70"
 * e 1.7 apareciam como uma alteração que ninguém fez.
 */
function sameValue(published: unknown, proposed: unknown): boolean {
  const isEmpty = (value: unknown) =>
    value === null || value === undefined || value === "";

  if (!isEmpty(published) && !isEmpty(proposed)) {
    const a = Number(published);
    const b = Number(proposed);
    if (!Number.isNaN(a) && !Number.isNaN(b)) return a === b;
  }

  return describeValue(published) === describeValue(proposed);
}

function diffPendingEdit(
  published: Record<string, unknown>,
  proposed: Record<string, unknown>,
): PendingChange[] {
  return EDIT_DIFF_FIELDS.filter(
    ({ key }) => key in proposed && !sameValue(published[key], proposed[key]),
  ).map(({ key, label }) => ({
    label,
    before: describeValue(published[key]),
    after: describeValue(proposed[key]),
  }));
}

export async function getUnverifiedCompanions(): Promise<
  (CompanionFiltered & { description: string })[]
> {
  // A página /verify já só a chama para admins, mas este ficheiro é 'use
  // server' e a função leva consigo os vídeos de verificação: não pode
  // depender de quem a chama ter feito a verificação.
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error("Não autorizado");
  }

  const legacyApprovedIds = await getLegacyApprovedIds();

  let query = db
    .select({
      companion: {
        id: companionsTable.id,
        name: companionsTable.name,
        shortDescription: companionsTable.shortDescription,
        description: companionsTable.description,
        price: companionsTable.price,
        age: companionsTable.age,
        verified: companionsTable.verified,
        identityVerified: companionsTable.identity_verified,
        identityVerifiedMethod: companionsTable.identity_verified_method,
        phone: companionsTable.phone,
        planType: sql<string>`CASE WHEN ${companionsTable.ad_expiration_date} > NOW() THEN ${companionsTable.plan_type} ELSE 'free' END`.as('planType'),
      },
      city: {
        name: citiesTable.city,
      },
      characteristics: {
        weight: characteristicsTable.weight,
        height: characteristicsTable.height,
        ethnicity: characteristicsTable.ethnicity,
        eye_color: characteristicsTable.eye_color,
        hair_color: characteristicsTable.hair_color,
        silicone: characteristicsTable.silicone,
        tattoos: characteristicsTable.tattoos,
        piercings: characteristicsTable.piercings,
        smoker: characteristicsTable.smoker,
      },
      // Fica à parte do grupo `companion` porque esse é devolvido inteiro ao
      // ecrã: estes campos servem só para comparar com a edição proposta.
      publishedOnly: {
        phoneNumber: companionsTable.phone,
        instagramHandle: companionsTable.instagramHandle,
        gender: companionsTable.gender,
        gender_identity: companionsTable.gender_identity,
        languages: companionsTable.languages,
        meets_at_hotel: companionsTable.meets_at_hotel,
        meets_at_own_place: companionsTable.meets_at_own_place,
        hair_length: characteristicsTable.hair_length,
        shoe_size: characteristicsTable.shoe_size,
      },
      review: {
        sentToReviewAt: companionsTable.sent_to_review_at,
        submittedAt: companionsTable.submitted_at,
        createdAt: companionsTable.created_at,
        rejectionReason: companionsTable.rejection_reason,
      },
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    // leftJoin: um perfil sem a linha de características não pode ficar
    // invisível ao admin. A criação do perfil insere-a sempre, mas a fila é o
    // último sítio onde um registo se pode perder em silêncio.
    .leftJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id),
    )
    .where(
      or(
        // Registo por aprovar, ainda sem nada publicado.
        and(
          eq(companionsTable.verified, false),
          // Recusados saem da fila (ficam no separador "Recusadas") até ela
          // corrigir o perfil.
          isNull(companionsTable.rejected_at),
          sql`EXISTS (
            SELECT 1 FROM ${imagesTable}
            WHERE ${imagesTable.companionId} = ${companionsTable.id}
          )`,
          // Entra logo que o perfil é criado (submitted_at), com ou sem
          // verificação. Os registos anteriores a essa regra só entram se
          // tiverem enviado documento, como antes; mais as excepções de
          // sempre: os que já estavam aprovados antes da desverificação em
          // massa e os que o admin devolveu à fila de propósito.
          or(
            isNotNull(companionsTable.submitted_at),
            sql`EXISTS (
              SELECT 1 FROM ${documentsTable}
              WHERE ${documentsTable.companionId} = ${companionsTable.id}
            )`,
            isNotNull(companionsTable.sent_to_review_at),
            legacyApprovedIds.length > 0
              ? inArray(companionsTable.id, legacyApprovedIds)
              : sql`false`,
          ),
        ),
        // No ar sem selo, com vídeo e documento à espera: entra para o admin
        // os ver, sem sair do site.
        and(
          eq(companionsTable.verified, true),
          eq(companionsTable.identity_verified, false),
          sql`EXISTS (
            SELECT 1 FROM ${documentsTable}
            WHERE ${documentsTable.companionId} = ${companionsTable.id}
              AND ${documentsTable.document_type} = 'verification_video'
              AND ${documentsTable.status} = 'pendente'
          )`,
          sql`EXISTS (
            SELECT 1 FROM ${documentsTable}
            WHERE ${documentsTable.companionId} = ${companionsTable.id}
              AND ${documentsTable.document_type} IN ('id_card', 'passport', 'drivers_license', 'selfie')
              AND ${documentsTable.status} = 'pendente'
          )`,
        ),
        // Perfil no ar com alterações por rever. Entra na fila sem sair do
        // site: o visitante continua a ver a versão aprovada.
        //
        // O `verified` aqui não é redundante. Sem ele, um perfil por aprovar
        // que tivesse um rascunho antigo entrava na fila por esta via, sem
        // passar pela exigência de documento, e aparecia como registo novo —
        // ou seja, com o botão de recusar a apagá-lo.
        and(
          eq(companionsTable.verified, true),
          or(
            sql`EXISTS (
              SELECT 1 FROM ${companionPendingEditsTable}
              WHERE ${companionPendingEditsTable.companion_id} = ${companionsTable.id}
            )`,
            // Fotos novas contam como edição, mesmo sem texto nenhum mudado.
            sql`EXISTS (
              SELECT 1 FROM ${imagesTable}
              WHERE ${imagesTable.companionId} = ${companionsTable.id}
                AND ${imagesTable.pending_approval}
            )`,
            // E o mesmo para um áudio novo.
            sql`EXISTS (
              SELECT 1 FROM ${audioRecordingsTable}
              WHERE ${audioRecordingsTable.companionId} = ${companionsTable.id}
                AND ${audioRecordingsTable.pending_approval}
            )`,
          ),
        ),
      ),
    )
    // Os mais recentes primeiro.
    .orderBy(
      desc(sql`COALESCE(${companionsTable.submitted_at}, ${companionsTable.created_at})`),
    );

  const results = await query;
  if (results.length === 0) return [];

  const companionIds = results.map((r) => r.companion.id);
  const resumosPromise = resumoDocumentosPorCompanion(companionIds);

  // Aqui, ao contrário das leituras públicas, as fotos por aprovar têm mesmo
  // de aparecer: são elas que o admin precisa de ver.
  const imagesPromise = db
    .select({
      companionId: imagesTable.companionId,
      public_url: imagesTable.public_url,
      storage_path: imagesTable.storage_path,
      focal_x: imagesTable.focal_x,
      focal_y: imagesTable.focal_y,
      zoom: imagesTable.zoom,
      pending_approval: imagesTable.pending_approval,
    })
    .from(imagesTable)
    .where(inArray(imagesTable.companionId, companionIds))
    // As novas primeiro: é o que o admin está ali para rever.
    .orderBy(
      desc(imagesTable.pending_approval),
      asc(imagesTable.position),
      asc(imagesTable.id),
    );

  const pendingEditsPromise = db
    .select({
      companionId: companionPendingEditsTable.companion_id,
      payload: companionPendingEditsTable.payload,
    })
    .from(companionPendingEditsTable)
    .where(inArray(companionPendingEditsTable.companion_id, companionIds));

  // O vídeo que interessa é o que está à espera; depois o aprovado; por fim o
  // recusado mais recente. Fica o primeiro de cada perfil.
  const videosPromise = db
    .select({
      companionId: documentsTable.companionId,
      storage_path: documentsTable.storage_path,
      public_url: documentsTable.public_url,
    })
    .from(documentsTable)
    .where(
      and(
        inArray(documentsTable.companionId, companionIds),
        eq(documentsTable.document_type, "verification_video"),
      ),
    )
    .orderBy(
      sql`CASE ${documentsTable.status} WHEN 'pendente' THEN 0 WHEN 'aprovado' THEN 1 ELSE 2 END`,
      desc(documentsTable.created_at),
    );

  const audiosPromise = db
    .select({
      companionId: audioRecordingsTable.companionId,
      public_url: audioRecordingsTable.public_url,
      pending: audioRecordingsTable.pending_approval,
    })
    .from(audioRecordingsTable)
    .where(inArray(audioRecordingsTable.companionId, companionIds))
    .orderBy(desc(audioRecordingsTable.created_at));

  const [images, videos, pendingEdits, audios, resumos] = await Promise.all([
    imagesPromise,
    videosPromise,
    pendingEditsPromise,
    audiosPromise,
    resumosPromise,
  ]);

  // O áudio que está no perfil e o que está à espera, para o admin ouvir os
  // dois. Mais recentes primeiro: fica o primeiro de cada tipo.
  const audioMap = new Map<number, { current?: string; pending?: string }>();
  for (const audio of audios) {
    const entry = audioMap.get(audio.companionId) ?? {};
    if (audio.pending) entry.pending ??= audio.public_url;
    else entry.current ??= audio.public_url;
    audioMap.set(audio.companionId, entry);
  }

  const imagesMap = images.reduce((acc, img) => {
    if (!acc.has(img.companionId.toString())) {
      acc.set(img.companionId.toString(), []);
    }
    // O storage_path vai junto para o admin poder reenquadrar a foto durante
    // a verificação, que é a forma de identificar a imagem ao gravar.
    acc.get(img.companionId.toString())!.push({
      publicUrl: img.public_url,
      storagePath: img.storage_path,
      focalX: img.focal_x,
      focalY: img.focal_y,
      zoom: img.zoom,
      pendingApproval: img.pending_approval,
    });
    return acc;
  }, new Map<string, Media[]>());

  const pendingEditsMap = new Map(
    pendingEdits.map((edit) => [edit.companionId, edit.payload]),
  );

  // O bucket dos documentos é privado: o vídeo só abre por endereço assinado.
  // Só se assina o primeiro de cada perfil, que é o que aparece.
  const primeiroVideo = new Map<number, (typeof videos)[number]>();
  for (const vid of videos) {
    if (!primeiroVideo.has(vid.companionId)) primeiroVideo.set(vid.companionId, vid);
  }
  const signedVideos = await Promise.all(
    [...primeiroVideo.values()].map(async (vid) => ({
      companionId: vid.companionId,
      url: await signDocumentUrl(vid),
    })),
  );

  const videosMap = signedVideos.reduce((acc, vid) => {
    if (vid.url) acc.set(vid.companionId.toString(), vid.url);
    return acc;
  }, new Map<string, string>());

  return results.map(({ companion, city, characteristics, publishedOnly, review }) => {
    const proposed = pendingEditsMap.get(companion.id);
    const images = imagesMap.get(String(companion.id)) || [];

    const audio = audioMap.get(companion.id);
    const resumo = resumos.get(companion.id)!;

    // Estar no ar e aparecer nesta lista acontece por causa de uma edição
    // por rever (no texto, em fotos novas ou num áudio novo) ou de vídeo e
    // documento à espera.
    const isPendingEdit =
      companion.verified === true &&
      (Boolean(proposed) ||
        images.some((image) => image.pendingApproval) ||
        Boolean(audio?.pending));

    return {
      ...companion,
      description: companion.description,
      city: city.name,
      weight: characteristics?.weight ?? null,
      height: characteristics?.height ?? null,
      eyeColor: characteristics?.eye_color ?? null,
      hairColor: characteristics?.hair_color ?? null,
      silicone: characteristics?.silicone ?? null,
      tattoos: characteristics?.tattoos ?? null,
      piercings: characteristics?.piercings ?? null,
      smoker: characteristics?.smoker ?? null,
      ethinicity: characteristics?.ethnicity ?? null,
      planType: companion.planType,
      images,
      verificationVideoUrl: videosMap.get(String(companion.id)) || null,
      currentAudioUrl: audio?.current ?? null,
      pendingAudioUrl: audio?.pending ?? null,
      // Já esteve aprovada e foi o admin que a devolveu à fila. Importa
      // distinguir de um registo novo.
      wasSentToReview: review.sentToReviewAt !== null,
      isPendingEdit,
      isDocsReview:
        companion.verified === true &&
        !companion.identityVerified &&
        temDocumentosPendentes(resumo),
      verificacao: estadoVerificacao(companion.identityVerified, resumo),
      verificacaoCompletaPendente: verificacaoCompletaPendente(resumo),
      temDocumentosPendentes: temDocumentosPendentes(resumo),
      motivoRecusaDocumentos: resumo.motivoRecusa,
      semCaracteristicas: caracteristicasVazias({
        ...(characteristics ?? {}),
        hair_length: publishedOnly.hair_length,
        shoe_size: publishedOnly.shoe_size,
      }),
      submittedAt: review.submittedAt ?? review.createdAt,
      // Fora do separador "Recusadas", um motivo gravado é de uma recusa
      // anterior: ela corrigiu o perfil e reenviou.
      recusaAnterior: review.rejectionReason,
      pendingChanges: proposed
        ? diffPendingEdit(
          {
            ...companion,
            ...(characteristics ?? {}),
            ...publishedOnly,
          },
          proposed,
        )
        : [],
    };
  });
}

export async function updateCompanionAge(id: number, age: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error("Não autorizado");
  }

  if (!Number.isInteger(age) || age < 18 || age > 99) {
    throw new Error("Idade inválida");
  }

  await db
    .update(companionsTable)
    .set({ age })
    .where(eq(companionsTable.id, id));

  return { success: true, id, age };
}

/**
 * Perfis importados ainda sem conta têm um email provisório (.invalid): não há
 * ninguém do outro lado para receber a automação do RD.
 */
function emailParaRD(email: string | null | undefined): email is string {
  return Boolean(email) && !email!.endsWith(".invalid");
}

/**
 * Dá o selo "Verificada": aprova o vídeo e o documento que estiverem à espera
 * e devolve os campos com quem o deu, quando e por que via. A via é
 * 'documento' se ela enviou o documento de identificação pelo site, senão
 * 'whatsapp' (o admin viu-o fora do site). Só o admin lê estes campos: no
 * site o selo é igual para todas.
 */
async function darSelo(companionId: number, adminId: string) {
  const resumo = await resumoDocumentos(companionId);
  const agora = new Date();

  await db
    .update(documentsTable)
    .set({
      status: "aprovado",
      verified: true,
      verification_date: agora,
      reviewed_by: adminId,
      updated_at: agora,
    })
    .where(
      and(eq(documentsTable.companionId, companionId), eq(documentsTable.status, "pendente")),
    );

  const viaDocumento = resumo.documento === "pendente" || resumo.documento === "aprovado";
  return {
    identity_verified: true,
    identity_verified_at: agora,
    identity_verified_by: adminId,
    identity_verified_method: viaDocumento ? "documento" : "whatsapp",
  };
}

/**
 * Aprova um registo novo ou uma edição de um perfil que já está no ar. Nos dois
 * casos é aqui que o conteúdo por rever passa a ser o publicado: as alterações
 * guardadas à espera são escritas no perfil e as fotos novas tornam-se visíveis.
 *
 * O selo é decisão explícita do admin (`comSelo`), e não consequência de
 * existir um documento: um documento pode ter sido recusado, e um admin pode
 * ter visto o documento por WhatsApp.
 */
export async function approveCompanion(
  id: number,
  { comSelo = false }: { comSelo?: boolean } = {},
) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error("Não autorizado");
  }

  const [before] = await db
    .select({
      verified: companionsTable.verified,
      identityVerified: companionsTable.identity_verified,
    })
    .from(companionsTable)
    .where(eq(companionsTable.id, id))
    .limit(1);

  if (!before) {
    throw new Error("Perfil não encontrado");
  }

  // Com vídeo e documento enviados, já não se põe no ar sem selo: ou se
  // aprova como verificada, ou se recusam os documentos primeiro. Uma
  // verificação a meio não bloqueia, e ela continua com o aviso para acabar.
  if (!before.verified && !before.identityVerified && !comSelo) {
    if (verificacaoCompletaPendente(await resumoDocumentos(id))) {
      throw new Error(
        "Ela enviou vídeo e documento: aprove como verificada ou recuse os documentos primeiro.",
      );
    }
  }

  const [pendingEdit] = await db
    .select({ payload: companionPendingEditsTable.payload })
    .from(companionPendingEditsTable)
    .where(eq(companionPendingEditsTable.companion_id, id))
    .limit(1);

  if (pendingEdit) {
    await applyCompanionFormValues(
      id,
      pendingEdit.payload as unknown as RegisterCompanionFormValues,
    );
    await db
      .delete(companionPendingEditsTable)
      .where(eq(companionPendingEditsTable.companion_id, id));
  }

  await approvePendingImages(id);
  await approvePendingAudio(id);

  const novoSelo = comSelo && !before.identityVerified;
  const selo = novoSelo ? await darSelo(id, userId) : {};

  const [companion] = await db
    .update(companionsTable)
    .set({
      verified: true,
      sent_to_review_at: null,
      rejected_at: null,
      ...selo,
    })
    .where(eq(companionsTable.id, id))
    .returning({ email: companionsTable.email, name: companionsTable.name });

  if (emailParaRD(companion?.email)) {
    // O evento de conversão marca a entrada na plataforma, por isso só
    // dispara na primeira aprovação. Aprovar uma edição de quem já estava no
    // ar não é uma conversão nova e não pode voltar a contar como tal. Sem
    // selo, o evento é outro, para as boas-vindas pedirem a verificação.
    if (!before.verified) {
      await tagCompanionInRD(companion.email, "aprovado", companion.name);
      await sendConversionEventToRD(
        companion.email,
        before.identityVerified || comSelo
          ? RD_CONVERSION_APROVADA
          : RD_CONVERSION_APROVADA_SEM_VERIFICACAO,
        companion.name,
      );
    }
    if (novoSelo) {
      await tagCompanionInRD(companion.email, "verificada", companion.name);
    }
  }

  // Sem isto a aprovação só ficava visível quando o cache da listagem
  // expirasse sozinho, o que podia demorar até meia hora.
  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true, id };
}

/**
 * Selo "Verificada" dado fora da aprovação: a partir do perfil dela (o admin
 * recebeu o documento por WhatsApp) ou na fila, para quem já está no ar e
 * enviou vídeo e documento. Não mexe na publicação.
 */
export async function verifyIdentityAsAdmin(companionId: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return { success: false, error: "Não autorizado" };
  }

  const [alvo] = await db
    .select({
      identityVerified: companionsTable.identity_verified,
      email: companionsTable.email,
      name: companionsTable.name,
    })
    .from(companionsTable)
    .where(eq(companionsTable.id, companionId))
    .limit(1);

  if (!alvo) {
    return { success: false, error: "Perfil não encontrado." };
  }
  if (alvo.identityVerified) {
    return { success: true, method: null };
  }

  const selo = await darSelo(companionId, userId);
  await db
    .update(companionsTable)
    .set({ ...selo, updated_at: new Date() })
    .where(eq(companionsTable.id, companionId));

  if (emailParaRD(alvo.email)) {
    await tagCompanionInRD(alvo.email, "verificada", alvo.name);
  }

  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true, method: selo.identity_verified_method };
}

/**
 * Recusar tem dois significados, consoante o que está em revisão:
 *
 * - Perfil já no ar: o que se recusa é a edição. As alterações propostas e as
 *   fotos novas são descartadas, e o anúncio aprovado fica exactamente como
 *   estava. Apagar a acompanhante aqui seria destruir uma cliente por causa
 *   de uma mudança de descrição.
 * - Registo por aprovar: o perfil sai da fila, com o motivo, mas não se apaga
 *   nada. Ela vê o motivo ao entrar e, se corrigir o perfil, volta à fila. O
 *   admin pode reverter ou apagar de vez no separador "Recusadas".
 */
export async function rejectCompanion(id: number, motivo?: string) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error("Não autorizado");
  }

  const [companion] = await db
    .select({
      verified: companionsTable.verified,
      email: companionsTable.email,
      name: companionsTable.name,
    })
    .from(companionsTable)
    .where(eq(companionsTable.id, id))
    .limit(1);

  if (!companion) {
    return { success: false, id, discardedEdit: false };
  }

  if (companion.verified) {
    await db
      .delete(companionPendingEditsTable)
      .where(eq(companionPendingEditsTable.companion_id, id));
    await discardPendingImages(id);
    await discardPendingAudio(id);

    revalidateTag("companion", "max");
    revalidateTag("companions", "max");
    revalidateTag("companions-filter", "max");

    return { success: true, id, discardedEdit: true };
  }

  const razao = motivo?.trim();
  if (!razao) {
    throw new Error("Escreva o motivo da recusa: ela vai vê-lo.");
  }

  await db
    .update(companionsTable)
    .set({
      rejected_at: new Date(),
      rejection_reason: razao.slice(0, 1000),
      updated_at: new Date(),
    })
    .where(eq(companionsTable.id, id));

  if (emailParaRD(companion.email)) {
    await tagCompanionInRD(companion.email, "recusado", companion.name);
    await sendConversionEventWithReason(
      companion.email,
      RD_CONVERSION_RECUSADA,
      companion.name,
      razao,
    );
  }

  // Não estava no ar, por isso nenhuma listagem muda; é pela pré-visualização
  // dela, que lê da cache.
  revalidateTag("companion", "max");

  return { success: true, id, discardedEdit: false };
}

/** Devolve um perfil recusado à fila, como se ela o tivesse reenviado. */
export async function revertRejection(id: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return { success: false, error: "Não autorizado" };
  }

  const [companion] = await db
    .update(companionsTable)
    .set({ rejected_at: null, submitted_at: new Date(), updated_at: new Date() })
    .where(and(eq(companionsTable.id, id), isNotNull(companionsTable.rejected_at)))
    .returning({ id: companionsTable.id, name: companionsTable.name });

  if (!companion) {
    return { success: false, error: "Perfil não encontrado ou já não está recusado." };
  }

  revalidateTag("companion", "max");
  return { success: true, name: companion.name };
}

/**
 * Apaga de vez um perfil recusado, com fotos, áudio, vídeo e documentos, e
 * cancela na Stripe o que ainda o pudesse cobrar. É o caminho para pedidos de
 * remoção (RGPD) e para spam. Não avisa o RD.
 *
 * Só aceita perfis recusados: um clique fora do sítio não pode apagar um
 * anúncio no ar.
 */
export async function deleteCompanionPermanently(id: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return { success: false, error: "Não autorizado" };
  }

  const [alvo] = await db
    .select({
      rejectedAt: companionsTable.rejected_at,
      authId: companionsTable.auth_id,
      stripeCustomerId: companionsTable.stripe_customer_id,
    })
    .from(companionsTable)
    .where(eq(companionsTable.id, id))
    .limit(1);

  if (!alvo) {
    return { success: false, error: "Perfil não encontrado." };
  }
  if (!alvo.rejectedAt) {
    return { success: false, error: "Só se apagam de vez perfis recusados." };
  }

  // Antes de tudo, a cobrança: apagar o perfil não pára a Stripe, e uma
  // subscrição que ficasse viva continuava a cobrar sem anúncio nenhum. Se
  // não der para cancelar, não se apaga nada.
  try {
    const { falhas } = await cancelarSubscricoesNaStripe({
      clerkId: alvo.authId,
      stripeCustomerId: alvo.stripeCustomerId,
    });
    if (falhas.length > 0) {
      return {
        success: false,
        error: "Não foi possível cancelar a subscrição na Stripe. O perfil não foi apagado.",
      };
    }
  } catch (error) {
    console.error("Falha ao procurar subscrições na Stripe antes de apagar:", error);
    return {
      success: false,
      error: "Não foi possível falar com a Stripe para cancelar a subscrição. O perfil não foi apagado.",
    };
  }

  // Os ficheiros a seguir: depois de apagar o perfil já não se sabe a pasta.
  const ficheiros = await deleteAllDocumentsFromCompanion(id);
  if (!ficheiros.success) {
    return {
      success: false,
      error: "Não foi possível apagar os ficheiros. O perfil não foi apagado.",
    };
  }

  await db.transaction(async (tx) => {
    // audio_recordings não tem chave estrangeira para companions, por isso não
    // vai com o cascade.
    await tx
      .delete(audioRecordingsTable)
      .where(eq(audioRecordingsTable.companionId, id));
    await tx.delete(companionsTable).where(eq(companionsTable.id, id));
  });

  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true };
}

/** Separador "Recusadas" da página de verificação. */
export async function getRejectedCompanions() {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error("Não autorizado");
  }

  return db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      phone: companionsTable.phone,
      city: citiesTable.city,
      rejectedAt: companionsTable.rejected_at,
      rejectionReason: companionsTable.rejection_reason,
      cover: sql<string | null>`(
        SELECT ${imagesTable.public_url} FROM ${imagesTable}
        WHERE ${imagesTable.companionId} = ${companionsTable.id}
        ORDER BY ${imagesTable.position}, ${imagesTable.id}
        LIMIT 1
      )`,
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .where(and(eq(companionsTable.verified, false), isNotNull(companionsTable.rejected_at)))
    .orderBy(desc(companionsTable.rejected_at));
}

/**
 * Pausa ou reactiva o anúncio da própria companion. Diferente de `verified`
 * (aprovação do admin) — o anúncio fica invisível no site sem perder o
 * estado de verificação, e volta a aparecer sozinho ao reactivar.
 */
export async function setCompanionPaused(clerkId: string, paused: boolean) {
  const [companion] = await db
    .update(companionsTable)
    .set({ paused, updated_at: new Date() })
    .where(eq(companionsTable.auth_id, clerkId))
    .returning({ id: companionsTable.id });

  if (!companion) {
    return { success: false, error: "Perfil não encontrado." };
  }

  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true, paused };
}

/**
 * Pausa ou reactiva um anúncio a partir da página do próprio perfil, pelo
 * admin. Fica separada de setCompanionPaused porque aquela identifica a
 * companion pela sessão de quem grava, e é essa verificação de dono que não
 * pode ser afrouxada só para servir os dois casos.
 */
export async function setCompanionPausedAsAdmin(
  companionId: number,
  paused: boolean,
) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return { success: false, error: "Não autorizado" };
  }

  // Perfil criado pelo admin e ainda sem conta dela: pôr no ar é o admin a
  // confirmar que ela autorizou por WhatsApp, e fica registado como tal.
  if (!paused) {
    const [alvo] = await db
      .select({ authId: companionsTable.auth_id })
      .from(companionsTable)
      .where(eq(companionsTable.id, companionId))
      .limit(1);
    if (alvo && isImportedAuthId(alvo.authId)) {
      await registarConsentimentoAoPublicar(db, companionId, userId);
    }
  }

  const [companion] = await db
    .update(companionsTable)
    .set({ paused, updated_at: new Date() })
    .where(eq(companionsTable.id, companionId))
    .returning({ id: companionsTable.id });

  if (!companion) {
    return { success: false, error: "Perfil não encontrado." };
  }

  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true, paused };
}

/**
 * Tira o anúncio do ar e devolve-o à fila de verificação.
 *
 * O `sent_to_review_at` não é decorativo: a fila exige documento de
 * verificação para alguém entrar, e há perfis aprovados que já não têm
 * documento. Sem esta marca, desverificá-los tirava-os do site sem os fazer
 * aparecer na fila, deixando-os sem caminho de volta pela interface.
 */
export async function sendCompanionToReview(companionId: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return { success: false, error: "Não autorizado" };
  }

  const [companion] = await db
    .update(companionsTable)
    .set({
      verified: false,
      sent_to_review_at: new Date(),
      updated_at: new Date(),
    })
    .where(eq(companionsTable.id, companionId))
    .returning({ id: companionsTable.id, name: companionsTable.name });

  if (!companion) {
    return { success: false, error: "Perfil não encontrado." };
  }

  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true, name: companion.name };
}

/**
 * Marca uma sugar como "do dia" — o destaque único no hero da homepage.
 *
 * Só aceita quem tem VIP activo: plan_type = 'vip' não chega sozinho, porque
 * fica gravado mesmo depois de expirar (só é reescrito quando chega o
 * próximo webhook do Stripe). A troca é uma única transacção — desmarca
 * quem tinha o título e marca a nova — para nunca haver duas ao mesmo tempo,
 * nem por um instante.
 */
export async function setSugarOfDay(companionId: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return { success: false, error: "Não autorizado" };
  }

  const [elegivel] = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      verified: companionsTable.verified,
      paused: companionsTable.paused,
      plan_type: companionsTable.plan_type,
      ad_expiration_date: companionsTable.ad_expiration_date,
    })
    .from(companionsTable)
    .where(eq(companionsTable.id, companionId))
    .limit(1);

  if (!elegivel) {
    return { success: false, error: "Perfil não encontrado." };
  }
  const vipActivo =
    elegivel.plan_type === "vip" &&
    elegivel.ad_expiration_date !== null &&
    elegivel.ad_expiration_date > new Date();
  if (!vipActivo || !elegivel.verified || elegivel.paused) {
    return {
      success: false,
      error: "Só uma sugar com VIP activo, verificada e no ar pode ser destacada.",
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(companionsTable)
      .set({ is_sugar_of_day: false, updated_at: new Date() })
      .where(eq(companionsTable.is_sugar_of_day, true));

    await tx
      .update(companionsTable)
      .set({ is_sugar_of_day: true, updated_at: new Date() })
      .where(eq(companionsTable.id, companionId));
  });

  revalidateTag("companion", "max");
  revalidatePath("/");

  return { success: true, name: elegivel.name };
}

/** Tira o destaque sem escolher outra sugar para o lugar. */
export async function clearSugarOfDay(companionId: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    return { success: false, error: "Não autorizado" };
  }

  const [companion] = await db
    .update(companionsTable)
    .set({ is_sugar_of_day: false, updated_at: new Date() })
    .where(eq(companionsTable.id, companionId))
    .returning({ id: companionsTable.id, name: companionsTable.name });

  if (!companion) {
    return { success: false, error: "Perfil não encontrado." };
  }

  revalidateTag("companion", "max");
  revalidatePath("/");

  return { success: true, name: companion.name };
}

export async function getCompanionIdByClerkId(id: string): Promise<number> {
  const companion = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, id))
    .limit(1);

  return companion[0].id;
}

// Blocked Users Management Functions
export async function blockUser(
  companionId: number,
  blockedUserId: string,
  reason?: string,
) {
  try {
    await db.insert(blockedUsersTable).values({
      companion_id: companionId,
      blocked_user_id: blockedUserId,
      reason: reason || null,
    });
    return { success: true };
  } catch (error) {
    // If user is already blocked, return success
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return { success: true };
    }
    throw error;
  }
}

export async function unblockUser(companionId: number, blockedUserId: string) {
  await db
    .delete(blockedUsersTable)
    .where(
      and(
        eq(blockedUsersTable.companion_id, companionId),
        eq(blockedUsersTable.blocked_user_id, blockedUserId),
      ),
    );
  return { success: true };
}

export async function getBlockedUsers(companionId: number) {
  return await db
    .select({
      id: blockedUsersTable.id,
      blocked_user_id: blockedUsersTable.blocked_user_id,
      reason: blockedUsersTable.reason,
      created_at: blockedUsersTable.created_at,
    })
    .from(blockedUsersTable)
    .where(eq(blockedUsersTable.companion_id, companionId))
    .orderBy(desc(blockedUsersTable.created_at));
}

export async function isUserBlocked(
  companionId: number,
  userId: string,
): Promise<boolean> {
  const blockedUser = await db
    .select({ id: blockedUsersTable.id })
    .from(blockedUsersTable)
    .where(
      and(
        eq(blockedUsersTable.companion_id, companionId),
        eq(blockedUsersTable.blocked_user_id, userId),
      ),
    )
    .limit(1);

  return blockedUser.length > 0;
}

export async function companionExists(companionId: number): Promise<boolean> {
  const companion = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.id, companionId))
    .limit(1);

  return companion.length > 0;
}
