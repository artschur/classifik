'use server';

import {
  companionsTable,
  characteristicsTable,
  citiesTable,
  NewCompanion,
  Companion,
  neighborhoodsTable,
  NewCharacteristic,
} from '../schema';
import { db } from '..';
import { RegisterCompanionFormValues } from '@/components/formCompanionRegister';
import { auth } from '@clerk/nextjs/server';
import { CompanionFiltered, FilterTypesCompanions } from '../../types/types';
import { eq, and, gte, lte, desc, asc, SQL } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getEmail } from './userActions';

export async function getCompanionsToFilter(
  city: string,
  filters?: FilterTypesCompanions
): Promise<CompanionFiltered[]> {
  const {
    price,
    age,
    sort,
    silicone,
    tattoos,
    hairColor,
    height,
    weight,
    smoker,
    eyeColor,
  } = filters || {};

  // Collect all conditions
  const conditions: SQL[] = [
    eq(citiesTable.slug, city),
    eq(companionsTable.verified, true),
  ];

  if (price) {
    const [minPrice, maxPrice] = price.split('-');
    if (minPrice)
      conditions.push(gte(companionsTable.price, parseInt(minPrice)));
    if (maxPrice)
      conditions.push(lte(companionsTable.price, parseInt(maxPrice)));
  }

  if (age && age !== 'all') {
    const [minAge, maxAge] = age.split('-');
    if (minAge && maxAge) {
      conditions.push(
        gte(companionsTable.age, parseInt(minAge)),
        lte(companionsTable.age, parseInt(maxAge))
      );
    }
  }

  // Add characteristics table conditions
  if (hairColor && hairColor !== 'all') {
    const colors = hairColor.split(',');
    if (colors.length > 0) {
      conditions.push(
        sql`LOWER(${characteristicsTable.hair_color}) IN (${sql.join(
          colors.map((c) => sql`LOWER(${c})`),
          sql`, `
        )})`
      );
    }
  }

  if (eyeColor && eyeColor !== 'all') {
    conditions.push(
      sql`LOWER(${characteristicsTable.eye_color}) = LOWER(${eyeColor})`
    );
  }

  if (silicone) {
    conditions.push(
      sql`${characteristicsTable.silicone} = ${Boolean(silicone)}`
    );
  }

  if (tattoos) {
    conditions.push(eq(characteristicsTable.tattoos, tattoos === true));
  }

  if (smoker && smoker !== 'all') {
    conditions.push(eq(characteristicsTable.smoker, smoker === 'true'));
  }

  const query = db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      shortDescription: companionsTable.shortDescription,
      price: companionsTable.price,
      age: companionsTable.age,
      city: citiesTable.city,
      ethinicity: characteristicsTable.ethnicity,
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
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id)
    )
    .where(and(...conditions))
    .orderBy(
      sort
        ? sort.split('-')[1] === 'asc'
          ? asc(companionsTable[sort.split('-')[0] as 'price' | 'age'])
          : desc(companionsTable[sort.split('-')[0] as 'price' | 'age'])
        : asc(companionsTable.id)
    );

  return await query;
}

export async function registerCompanion(
  companionData: RegisterCompanionFormValues
) {
  let {
    name,
    email,
    phoneNumber,
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
    throw new Error('Failed to register companion');
  }
}

export async function getCompanionByClerkId(
  clerkId: string
): Promise<CompanionFiltered> {
  const companion = await db
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
  return companion[0];
}

export async function getCompanionToEdit(
  clerkId: string
): Promise<(RegisterCompanionFormValues & { id: number }) | null> {
  const [row] = await db
    .select({
      // Page one fields
      id: companionsTable.id,
      name: companionsTable.name,
      shortDescription: companionsTable.shortDescription,
      phoneNumber: companionsTable.phone,
      description: companionsTable.description,
      price: companionsTable.price,
      age: companionsTable.age,
      gender: companionsTable.gender,
      gender_identity: companionsTable.gender_identity,
      languages: companionsTable.languages,

      // Page two fields
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

      // Page three fields
      city: companionsTable.city_id,
      state: citiesTable.state,
      country: citiesTable.country,
      neighborhood: neighborhoodsTable.neighborhood,
    })
    .from(companionsTable)
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id)
    )
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .leftJoin(
      neighborhoodsTable,
      eq(neighborhoodsTable.id, companionsTable.neighborhood_id)
    )
    .where(eq(companionsTable.auth_id, clerkId))
    .limit(1);

  if (!row) {
    return null;
  }
  // Return the row in the shape of RegisterCompanionFormValues
  return {
    id: row.id,
    name: row.name ?? '',
    shortDescription: row.shortDescription ?? '',
    phoneNumber:
      row.phoneNumber && !row.phoneNumber.startsWith('+')
        ? `+${row.phoneNumber}`
        : row.phoneNumber ?? '',
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
  (RegisterCompanionFormValues & { id: number; cityName: string })[]
> {
  const rows = await db
    .select({
      id: companionsTable.id,
      name: companionsTable.name,
      shortDescription: companionsTable.shortDescription,
      phoneNumber: companionsTable.phone,
      description: companionsTable.description,
      price: companionsTable.price,
      age: companionsTable.age,
      gender: companionsTable.gender,
      gender_identity: companionsTable.gender_identity,
      languages: companionsTable.languages,
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
      city: companionsTable.city_id,
      cityName: citiesTable.city,
      state: citiesTable.state,
      country: citiesTable.country,
      neighborhood: neighborhoodsTable.neighborhood,
    })
    .from(companionsTable)
    .innerJoin(
      characteristicsTable,
      eq(characteristicsTable.companion_id, companionsTable.id)
    )
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    .leftJoin(
      neighborhoodsTable,
      eq(neighborhoodsTable.id, companionsTable.neighborhood_id)
    )
    .where(eq(companionsTable.verified, false));

  return rows.map((row) => ({
    id: row.id,
    name: row.name ?? '',
    shortDescription: row.shortDescription ?? '',
    phoneNumber:
      row.phoneNumber && !row.phoneNumber.startsWith('+')
        ? `+${row.phoneNumber}`
        : row.phoneNumber ?? '',
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
    cityName: row.cityName ?? '',
    state: row.state ?? '',
    country: row.country ?? '',
    neighborhood: row.neighborhood ?? '',
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

export async function getCompanionIdByClerkId(id: string) : Promise<number> {
  const companion = await db
    .select({ id: companionsTable.id })
    .from(companionsTable)
    .where(eq(companionsTable.auth_id, id))
    .limit(1);

  return companion[0].id;
}