"use server";

import {
  companionsTable,
  characteristicsTable,
  citiesTable,
  NewCompanion,
  neighborhoodsTable,
  NewCharacteristic,
  imagesTable,
  reviewsTable,
  blockedUsersTable,
  documentsTable,
  companionPendingEditsTable,
} from "../schema";
import { db } from "..";
import { RegisterCompanionFormValues } from "@/components/formCompanionRegister";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { isAdmin } from "@/components/header";
import {
  upsertContactInRD,
  tagCompanionInRD,
  sendConversionEventToRD,
  RD_CONVERSION_APROVADA,
  RD_CONVERSION_RECUSADA,
} from "@/lib/rd-station";
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
} from "drizzle-orm";
import { sql } from "drizzle-orm";
import { getEmail } from "./userActions";
import {
  approvePendingImages,
  discardPendingImages,
  getImagesByAuthId,
} from "./images";
import { unstable_cache, revalidateTag } from "next/cache";
import { PlanType } from "./kv";

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

/**
 * O concelho é digitado à mão pela anunciante, então o mesmo sítio chega
 * escrito de várias formas ("Cascais", "cascais", "CASCAIS"). Guardamos uma
 * linha canónica por concelho e distrito, identificada pelo slug, e ligamos a
 * companion a ela. Assim o campo fica pronto para servir de filtro ou de
 * página própria mais tarde, em vez de ser texto solto repetido.
 */
async function resolveNeighborhoodId(
  tx: typeof db,
  rawName: string | undefined | null,
  cityId: number,
): Promise<number | null> {
  const name = rawName?.trim();
  if (!name) return null;

  const slug = slugify(name);
  if (!slug) return null;

  const [existing] = await tx
    .select({ id: neighborhoodsTable.id })
    .from(neighborhoodsTable)
    .where(
      and(
        eq(neighborhoodsTable.slug, slug),
        eq(neighborhoodsTable.city_id, cityId),
      ),
    )
    .limit(1);

  if (existing) return existing.id;

  const [created] = await tx
    .insert(neighborhoodsTable)
    .values({ neighborhood: name, city_id: cityId, slug })
    .returning({ id: neighborhoodsTable.id });

  return created?.id ?? null;
}

function buildCompanionConditions(
  cityId: number,
  filters?: FilterTypesCompanions,
): SQL[] {
  const conditions: SQL[] = [
    eq(companionsTable.city_id, cityId),
    eq(companionsTable.verified, true),
    eq(companionsTable.paused, false),
  ];

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
      case "price-asc":
        sortConditions.push(asc(companionsTable.price));
        break;
      case "price-desc":
        sortConditions.push(desc(companionsTable.price));
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
  cityId: number,
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
        eq(companionsTable.plan_type, 'do_dia'),
        eq(companionsTable.verified, true),
        eq(companionsTable.paused, false),
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
// New function to count total companions for pagination
export async function countCompanionsPages(
  citySlug: string,
  pageSize: number,
  filters?: FilterTypesCompanions,
): Promise<number> {
  const cityId = await getCityIdFromSlug(citySlug);
  if (!cityId) return 0;

  const companionConditions = buildCompanionConditions(cityId, filters);
  const characteristicConditions = buildCharacteristicConditions(filters);
  const allConditions = [
    ...companionConditions,
    ...characteristicConditions,
  ].filter(Boolean);

  const [{ count }] = await db
    .select({ count: sql<number>`count(DISTINCT ${companionsTable.id})` })
    .from(companionsTable)
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id),
    )
    .where(and(...allConditions));

  return Math.ceil(count / pageSize);
}

// Main function to get filtered companions
export const getCompanionsToFilter = unstable_cache(
  async (
    citySlug: string,
    page: number,
    filters?: FilterTypesCompanions,
  ): Promise<CompanionFiltered[]> => {
    const pageSize = 9;
    const offset = (page - 1) * pageSize;

    // Get city ID
    const cityId = await getCityIdFromSlug(citySlug);
    if (!cityId) return [];

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

export async function registerCompanion(
  companionData: RegisterCompanionFormValues,
  clerkId: string,
  emailFromAuth: string,
) {
  // Destructure companionData and ensure the provided email is used.
  const {
    name,
    phoneNumber,
    instagramHandle,
    shortDescription,
    description,
    price,
    age,
    gender,
    gender_identity,
    languages,
    city,
    weight,
    height,
    ethnicity,
    eye_color,
    hair_color,
    hair_length,
    shoe_size,
    silicone,
    tattoos,
    piercings,
    smoker,
    meets_at_hotel,
    meets_at_own_place,
  } = companionData;

  // The function now trusts the email passed from the server action.
  const email = emailFromAuth;

  try {
    const newCompanion = await db.transaction(async (tx) => {
      const neighborhoodId = await resolveNeighborhoodId(
        tx as unknown as typeof db,
        companionData.neighborhood,
        city,
      );

      const [companion] = await tx
        .insert(companionsTable)
        .values({
          auth_id: clerkId, // Use the clerkId passed from the action
          name,
          email, // Use the email passed from the action
          phone: phoneNumber,
          instagramHandle,
          shortDescription,
          description,
          price,
          age,
          gender,
          gender_identity,
          languages,
          city_id: city,
          neighborhood_id: neighborhoodId,
          meets_at_hotel,
          meets_at_own_place,
        } as NewCompanion)
        .returning({ id: companionsTable.id });

      await tx.insert(characteristicsTable).values({
        height,
        ethnicity,
        companion_id: companion.id,
        eye_color,
        hair_color,
        hair_length,
        shoe_size,
        silicone,
        tattoos,
        piercings,
        weight,
        smoker,
      } as any);

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
    weight: parseInt(row.weight) ?? 60,
    height: parseFloat(row.height) ?? 1.6,
    ethnicity: row.ethnicity ?? "",
    eye_color: row.eye_color ?? "",
    hair_color: row.hair_color ?? "",
    hair_length: row.hair_length ?? "",
    shoe_size: row.shoe_size ?? 36,
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
        shortDescription: data.shortDescription,
        description: data.description,
        instagramHandle: data.instagramHandle,
        price: data.price,
        age: data.age,
        gender: data.gender,
        gender_identity: data.gender_identity,
        languages: data.languages,
        city_id: data.city,
        neighborhood_id: neighborhoodId,
        meets_at_hotel: data.meets_at_hotel,
        meets_at_own_place: data.meets_at_own_place,
        updated_at: new Date(),
      } as NewCompanion)
      .where(eq(companionsTable.id, companionId))
      .returning({ email: companionsTable.email });

    email = companion?.email;

    await tx
      .update(characteristicsTable)
      .set({
        weight: Number(data.weight),
        height: Number(data.height),
        ethnicity: data.ethnicity,
        eye_color: data.eye_color,
        hair_color: data.hair_color,
        hair_length: data.hair_length,
        shoe_size: data.shoe_size,
        silicone: data.silicone,
        tattoos: data.tattoos,
        piercings: data.piercings,
        smoker: data.smoker,
      } as NewCharacteristic)
      .where(eq(characteristicsTable.companion_id, companionId));
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
  clerkId: string,
  data: RegisterCompanionFormValues,
): Promise<{ pendingReview: boolean; }> {
  const [companion] = await db
    .select({
      id: companionsTable.id,
      verified: companionsTable.verified,
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);

  if (!companion) {
    throw new Error("Perfil não encontrado");
  }

  if (!companion.verified) {
    await applyCompanionFormValues(companion.id, data);
    return { pendingReview: false };
  }

  await db
    .insert(companionPendingEditsTable)
    .values({
      companion_id: companion.id,
      payload: data as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: companionPendingEditsTable.companion_id,
      set: {
        payload: data as unknown as Record<string, unknown>,
        updated_at: new Date(),
      },
    });

  return { pendingReview: true };
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
      },
    })
    .from(companionsTable)
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id),
    )
    .where(
      or(
        // Registo novo, ainda sem nada publicado.
        and(
          eq(companionsTable.verified, false),
          sql`EXISTS (
            SELECT 1 FROM ${imagesTable}
            WHERE ${imagesTable.companionId} = ${companionsTable.id}
          )`,
          // A regra continua a ser "só entra na fila quem enviou documento". As
          // excepções são os perfis que já estavam aprovados antes, que de
          // outra forma ficariam presos fora do site sem hipótese de
          // reaprovação, e os que o admin devolveu à fila de propósito.
          or(
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
          ),
        ),
      ),
    );

  const results = await query;
  if (results.length === 0) return [];

  const companionIds = results.map((r) => r.companion.id);

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

  const videosPromise = db
    .select({
      companionId: documentsTable.companionId,
      public_url: documentsTable.public_url,
    })
    .from(documentsTable)
    .where(
      and(
        inArray(documentsTable.companionId, companionIds),
        eq(documentsTable.document_type, "verification_video"),
      ),
    );

  const [images, videos, pendingEdits] = await Promise.all([
    imagesPromise,
    videosPromise,
    pendingEditsPromise,
  ]);

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

  const videosMap = videos.reduce((acc, vid) => {
    acc.set(vid.companionId.toString(), vid.public_url);
    return acc;
  }, new Map<string, string>());

  return results.map(({ companion, city, characteristics, publishedOnly, review }) => {
    const proposed = pendingEditsMap.get(companion.id);
    const images = imagesMap.get(String(companion.id)) || [];

    // Estar no ar e aparecer nesta lista só acontece por causa de uma edição
    // por rever, seja no texto, seja em fotos novas.
    const isPendingEdit =
      companion.verified === true &&
      (Boolean(proposed) || images.some((image) => image.pendingApproval));

    return {
      ...companion,
      description: companion.description,
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
      images,
      verificationVideoUrl: videosMap.get(String(companion.id)) || null,
      // Já esteve aprovada e foi o admin que a devolveu à fila. Importa
      // distinguir de um registo novo: recusar aqui apaga um perfil que
      // esteve publicado, não um candidato que nunca entrou.
      wasSentToReview: review.sentToReviewAt !== null,
      isPendingEdit,
      pendingChanges: proposed
        ? diffPendingEdit(
          {
            ...companion,
            ...characteristics,
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
 * Aprova um registo novo ou uma edição de um perfil que já está no ar. Nos dois
 * casos é aqui que o conteúdo por rever passa a ser o publicado: as alterações
 * guardadas à espera são escritas no perfil e as fotos novas tornam-se visíveis.
 */
export async function approveCompanion(id: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error("Não autorizado");
  }

  const [before] = await db
    .select({ verified: companionsTable.verified })
    .from(companionsTable)
    .where(eq(companionsTable.id, id))
    .limit(1);

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

  const [companion] = await db
    .update(companionsTable)
    .set({ verified: true, sent_to_review_at: null })
    .where(eq(companionsTable.id, id))
    .returning({ email: companionsTable.email, name: companionsTable.name });

  // O evento de conversão marca a entrada na plataforma, por isso só dispara
  // na primeira aprovação. Aprovar uma edição de quem já estava no ar não é
  // uma conversão nova e não pode voltar a contar como tal.
  if (before?.verified !== true && companion?.email) {
    await tagCompanionInRD(companion.email, "aprovado", companion.name);
    await sendConversionEventToRD(
      companion.email,
      RD_CONVERSION_APROVADA,
      companion.name,
    );
  }

  // Sem isto a aprovação só ficava visível quando o cache da listagem
  // expirasse sozinho, o que podia demorar até meia hora.
  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true, id };
}

/**
 * Recusar tem dois significados opostos, consoante o que está em revisão:
 *
 * - Perfil já no ar: o que se recusa é a edição. As alterações propostas e as
 *   fotos novas são descartadas, e o anúncio aprovado fica exactamente como
 *   estava. Apagar a acompanhante aqui seria destruir uma cliente por causa
 *   de uma mudança de descrição.
 * - Registo que nunca foi aprovado: não há nada publicado, e recusar significa
 *   mesmo não aceitar o perfil.
 */
export async function rejectCompanion(id: number) {
  const { userId } = await auth();
  if (!userId || !isAdmin(userId)) {
    throw new Error("Não autorizado");
  }

  const [companion] = await db
    .select({ verified: companionsTable.verified })
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

    revalidateTag("companion", "max");
    revalidateTag("companions", "max");
    revalidateTag("companions-filter", "max");

    return { success: true, id, discardedEdit: true };
  }

  let email: string | undefined;
  let name: string | undefined;

  await db.transaction(async (tx) => {
    const [deleted] = await tx
      .delete(companionsTable)
      .where(eq(companionsTable.id, id))
      .returning({ email: companionsTable.email, name: companionsTable.name });
    email = deleted?.email;
    name = deleted?.name;
  });

  if (email) {
    await tagCompanionInRD(email, "recusado", name);
    await sendConversionEventToRD(email, RD_CONVERSION_RECUSADA, name);
  }

  // O perfil foi apagado, mas sem isto continuava listado em cache, e quem
  // clicasse nele ia parar a uma página que já não existe.
  revalidateTag("companion", "max");
  revalidateTag("companions", "max");
  revalidateTag("companions-filter", "max");

  return { success: true, id, discardedEdit: false };
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
