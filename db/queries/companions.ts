'use server';

import {
  companionsTable,
  characteristicsTable,
  citiesTable,
  NewCompanion,
  Companion,
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
    // 1) Insert into companionsTable
    email = await getEmail();
    const [newCompanion] = await db
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

    await db.insert(characteristicsTable).values({
      height: height,
      ethnicity: ethnicity,
      companion_id: newCompanion.id,
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

    return newCompanion;
  } catch (error) {
    console.error('Error inserting companion or characteristics:', error);
    throw error;
  }
}

export async function getCompanionByClerkId(clerkId: string): Promise<CompanionFiltered> {
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
    .innerJoin(characteristicsTable, eq(characteristicsTable.companion_id, companionsTable.id))
    .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city_id))
    ;

  return companion[0];
}