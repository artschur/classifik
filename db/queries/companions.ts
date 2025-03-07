'use server';

import {
  companionsTable,
  characteristicsTable,
  citiesTable,
  NewCompanion,
  neighborhoodsTable,
  NewCharacteristic,
  imagesTable,
  reviewsTable,
} from '../schema';
import { db } from '..';
import { RegisterCompanionFormValues } from '@/components/formCompanionRegister';
import { auth } from '@clerk/nextjs/server';
import { CompanionFiltered, FilterTypesCompanions } from '../../types/types';
import { eq, and, gte, lte, desc, asc, SQL, inArray, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getEmail } from './userActions';
import { getImagesByAuthId } from './images';

function buildCompanionConditions(
  cityId: number,
  filters?: FilterTypesCompanions
): SQL[] {
  const conditions: SQL[] = [
    eq(companionsTable.city_id, cityId),
    eq(companionsTable.verified, true)
  ];

  if (filters?.search) {
    conditions.push(
      sql`LOWER(${companionsTable.name}) LIKE LOWER(${'%' + filters.search + '%'})`
    );
  }

  if (filters?.price) {
    const [minPrice, maxPrice] = filters.price.split('-').map(Number);
    if (minPrice && maxPrice) {
      conditions.push(
        sql`${gte(companionsTable.price, minPrice)} and ${lte(companionsTable.price
          , maxPrice)}`
      );
    }
  }

  if (filters?.age) {
    const [minAge, maxAge] = filters.age.split('-').map(Number);
    if (minAge && maxAge) {
      conditions.push(
        sql`${gte(companionsTable.age, minAge)} and ${lte(companionsTable.age, maxAge)}`
      );
    }
  }

  return conditions;
}

function buildCharacteristicConditions(filters?: FilterTypesCompanions): SQL[] {
  const conditions: SQL[] = [];

  if (filters?.height) {
    const [minHeight, maxHeight] = filters.height.split('-').map(Number);
    if (minHeight && maxHeight) {
      conditions.push(
        sql`${gte(characteristicsTable.height, (minHeight / 100).toString())} and ${lte(characteristicsTable.height, (maxHeight / 100).toString())}`
      );
    }
  }

  if (filters?.weight) {
    const [minWeight, maxWeight] = filters.weight.split('-').map(Number);
    if (minWeight && maxWeight) {
      conditions.push(
        sql`${gte(characteristicsTable.weight, minWeight.toString())} and ${lte(characteristicsTable.weight, maxWeight.toString())}`
      );
    }
  }

  if (filters?.hairColor) {
    const hairColors = filters.hairColor
      .split(',')
      .map((color) => color.trim().toLowerCase());
    conditions.push(
      inArray(
        sql`LOWER(${characteristicsTable.hair_color})`,
        hairColors
      )
    );
  }

  if (filters?.silicone) conditions.push(eq(characteristicsTable.silicone, true));
  if (filters?.tattoos) conditions.push(eq(characteristicsTable.tattoos, true));
  if (filters?.smoker) conditions.push(eq(characteristicsTable.smoker, true));

  return conditions;
}

function buildSortConditions(filters?: FilterTypesCompanions): SQL[] {
  const sortConditions: SQL[] = [];

  if (filters?.sort) {
    switch (filters.sort) {
      case 'price-asc':
        sortConditions.push(asc(companionsTable.price));
        break;
      case 'price-desc':
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
async function getCompanionImages(companionIds: number[]): Promise<Map<string, string[]>> {
  if (companionIds.length === 0) return new Map();

  const images = await db
    .select({
      companionId: imagesTable.companionId,
      public_url: imagesTable.public_url,
    })
    .from(imagesTable)
    .where(inArray(imagesTable.companionId, companionIds));

  return images.reduce((acc, img) => {
    if (!acc.has(img.companionId.toString())) {
      acc.set(img.companionId.toString(), []);
    }
    acc.get(img.companionId.toString())!.push(img.public_url);
    return acc;
  }, new Map<string, string[]>());
}

// Function to build the base companions query
function buildCompanionsQuery(
  cityId: number,
  companionConditions: SQL[],
  characteristicConditions: SQL[],
  sortConditions: SQL[]
) {
  const allConditions = [...companionConditions, ...characteristicConditions].filter(Boolean);

  return db
    .select({
      companion: {
        id: companionsTable.id,
        name: companionsTable.name,
        shortDescription: companionsTable.shortDescription,
        price: companionsTable.price,
        age: companionsTable.age,
        verified: companionsTable.verified,
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
    .innerJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
    .where(and(...allConditions))
    .orderBy(...sortConditions);
}

// New function to count total companions for pagination
export async function countCompanionsPages(
  citySlug: string,
  pageSize: number,
  filters?: FilterTypesCompanions
): Promise<number> {
  const cityId = await getCityIdFromSlug(citySlug);
  if (!cityId) return 0;

  const companionConditions = buildCompanionConditions(cityId, filters);
  const characteristicConditions = buildCharacteristicConditions(filters);
  const allConditions = [...companionConditions, ...characteristicConditions].filter(Boolean);

  const [{ count }] = await db
    .select({ count: sql<number>`count(DISTINCT ${companionsTable.id})` })
    .from(companionsTable)
    .innerJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
    .where(and(...allConditions));

  return Math.ceil(count / pageSize);
}

// Main function to get filtered companions
export async function getCompanionsToFilter(
  citySlug: string,
  page: number,
  filters?: FilterTypesCompanions
): Promise<CompanionFiltered[]> {
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
    sortConditions
  );

  // Execute the paginated query to get companions
  const results = await query.limit(pageSize).offset(offset);
  if (results.length === 0) return [];

  // Get companion IDs for fetching related data
  const companionIds = results.map(r => r.companion.id);

  // Fetch images in parallel with any other potential data fetches
  const imagesMap = await getCompanionImages(companionIds);

  // Map the results to the expected output format
  return results.map(({ companion, city, characteristics }) => ({
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
    images: imagesMap.get(String(companion.id)) || [],
  }));
}

export async function registerCompanion(
  companionData: RegisterCompanionFormValues
) {
  let {
    name,
    email,
    phoneNumber,
    instagramHandle,
    shortDescription,
    description,
    price,
    age,
    gender,
    gender_identity,
    languages,
    city, // assuming this is an integer id for the city
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
  } = companionData;

  const userSession = await auth();

  if (!userSession?.userId) {
    throw new Error('User not authenticated');
  }

  try {
    email = await getEmail();
    const newCompanion = await db.transaction(async (tx) => {
      // 1) Insert into companionsTable
      const [companion] = await tx
        .insert(companionsTable)
        .values({
          auth_id: userSession.userId,
          name: name,
          email: email,
          phone: phoneNumber,
          instagramHandle: instagramHandle,
          shortDescription: shortDescription,
          description: description,
          price: price,
          age: age,
          gender: gender,
          gender_identity: gender_identity,
          languages: languages,
          city_id: city,
        } as NewCompanion)
        .returning({ id: companionsTable.id });

      // 2) Insert into characteristicsTable
      await tx.insert(characteristicsTable).values({
        height: height,
        ethnicity: ethnicity,
        companion_id: companion.id,
        eye_color: eye_color,
        hair_color: hair_color,
        hair_length: hair_length,
        shoe_size: shoe_size,
        silicone: silicone,
        tattoos: tattoos,
        piercings: piercings,
        weight: weight,
        smoker: smoker,
      } as any);

      return companion;
    });

    return newCompanion;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to register companion');
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
      interactions: sql<number>`COALESCE(CAST(COUNT(CASE WHEN ${reviewsTable.liked_by} IS NOT NULL THEN 1 END) AS INTEGER), 0)`,
      averageRating: sql<number>`COALESCE(avg(${reviewsTable.rating}), 0)`,
    })
    .from(companionsTable)
    .leftJoin(reviewsTable, eq(reviewsTable.companion_id, companionsTable.id))
    .where(eq(companionsTable.auth_id, clerkId))
    .groupBy(companionsTable.id, companionsTable.name)  // Include name in GROUP BY
    .limit(1);

  if (!companion) {
    return {
      id: 0,
      name: "Usuário",
      interactions: 0,
      averageRating: 0
    };
  }

  return {
    id: companion.id,
    name: companion.name,
    interactions: companion.interactions,
    averageRating: Number(companion.averageRating).toFixed(1)
  };
}

export async function getCompanionNameByClerkId(
  clerkId: string
): Promise<{ name: string; id: number; }> {
  const [companion] = await db
    .select({
      name: companionsTable.name,
      id: companionsTable.id,
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);
  if (!companion) {
    throw new Error('Companion not found');
  }
  return {
    name: companion.name,
    id: companion.id,
  };
};

export async function getCompanionByClerkId(
  clerkId: string
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
    })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1)
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id)
    )
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id));

  const [response, images] = await Promise.all([
    query,
    getImagesByAuthId(clerkId),
  ]);

  const imageUrls = (images as { publicUrl: string; }[]).map((image) => image.publicUrl);

  return {
    ...response[0],
    images: imageUrls,
  };
}

export async function getCompanionToEdit(
  clerkId: string
): Promise<(RegisterCompanionFormValues & { companionId: number; }) | null> {
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

    db
      .select({
        neighborhood: neighborhoodsTable.neighborhood,
      })
      .from(neighborhoodsTable)
      .where(eq(neighborhoodsTable.id, companion.companionId))
      .limit(1),
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
  return {
    companionId: row.companionId,
    name: row.name ?? '',
    shortDescription: row.shortDescription ?? '',
    phoneNumber:
      row.phoneNumber && !row.phoneNumber.startsWith('+')
        ? `+${row.phoneNumber}`
        : row.phoneNumber ?? '',
    instagramHandle: row.instagramHandle ?? '',
    description: row.description ?? '',
    price: row.price ?? 0,
    age: row.age ?? 0,
    gender: row.gender ?? '',
    gender_identity: row.gender_identity ?? '',
    languages: row.languages ?? [],
    weight: parseInt(row.weight) ?? 60,
    height: parseFloat(row.height) ?? 1.6,
    ethnicity: row.ethnicity ?? '',
    eye_color: row.eye_color ?? '',
    hair_color: row.hair_color ?? '',
    hair_length: row.hair_length ?? '',
    shoe_size: row.shoe_size ?? 36,
    silicone: row.silicone ?? false,
    tattoos: row.tattoos ?? false,
    piercings: row.piercings ?? false,
    smoker: row.smoker ?? false,

    city: row.city ?? 1,
    state: row.state ?? '',
    country: row.country ?? '',
    neighborhood: row.neighborhood ?? '',
  };
}

export async function updateCompanionFromForm(
  clerkId: string,
  data: RegisterCompanionFormValues
) {
  await db.transaction(async (tx) => {
    // Update companionsTable
    await tx
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
      } as NewCompanion)
      .where(eq(companionsTable.auth_id, clerkId));

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
      .where(
        eq(
          characteristicsTable.companion_id,
          (
            await tx
              .select({ id: companionsTable.id })
              .from(companionsTable)
              .where(eq(companionsTable.auth_id, clerkId))
              .limit(1)
          )[0].id
        )
      );
  });
}

export async function getUnverifiedCompanions(): Promise<
  (CompanionFiltered & { description: string; })[]
> {
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
    .innerJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
    .where(eq(companionsTable.verified, false));

  const results = await query;
  if (results.length === 0) return [];

  const companionIds = results.map(r => r.companion.id);

  const imagesPromise = db
    .select({
      companionId: imagesTable.companionId,
      public_url: imagesTable.public_url,
    })
    .from(imagesTable)
    .where(inArray(imagesTable.companionId, companionIds));

  const [images] = await Promise.all([imagesPromise]);

  const imagesMap = images.reduce((acc, img) => {
    if (!acc.has(img.companionId.toString())) {
      acc.set(img.companionId.toString(), []);
    }
    acc.get(img.companionId.toString())!.push(img.public_url);
    return acc;
  }, new Map<string, string[]>());

  return results.map(({ companion, city, characteristics }) => ({
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
    images: imagesMap.get(String(companion.id)) || [],
  }));
}

export async function approveCompanion(id: number) {
  await db
    .update(companionsTable)
    .set({ verified: true })
    .where(eq(companionsTable.id, id));

  return { success: true, id };
}

export async function rejectCompanion(id: number) {
  await db.transaction(async (tx) => {
    await tx
      .delete(characteristicsTable)
      .where(eq(characteristicsTable.companion_id, id));

    await tx.delete(companionsTable).where(eq(companionsTable.id, id));
  });

  return { success: true, id };
}

export async function getCompanionIdByClerkId(id: string): Promise<number> {
  const companion = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, id))
    .limit(1);

  return companion[0].id;
}