import { stat } from 'fs';
import { db } from './index';
import {
  companionsTable,
  citiesTable,
  characteristicsTable,
  reviewsTable,
  City,
  Review,
} from './schema';
import { eq } from 'drizzle-orm';
import { CitySummary, CompanionById } from '../types/types';
import { getImagesByCompanionId } from './queries/images';



export async function getCompanionDetails(id: number) {
  const result = await db
    .select({
      name: companionsTable.name,
      email: companionsTable.email,
      auth_id: companionsTable.auth_id,
      phone: companionsTable.phone,
      price: companionsTable.price,
      verified: companionsTable.verified,
      shortDescription: companionsTable.shortDescription,
      description: companionsTable.description,
      age: companionsTable.age,
      gender: companionsTable.gender,
      gender_identity: companionsTable.gender_identity,
      languages: companionsTable.languages,
      last_seen: companionsTable.last_seen,
    })
    .from(companionsTable)
    .where(eq(companionsTable.id, id))
    .limit(1);

  return result[0];
}

export async function getCompanionCharacteristics(id: number) {
  const result = await db
    .select({
      weight: characteristicsTable.weight,
      height: characteristicsTable.height,
      ethnicity: characteristicsTable.ethnicity,
      eyeColor: characteristicsTable.eye_color,
      hairColor: characteristicsTable.hair_color,
      hair_length: characteristicsTable.hair_length,
      shoe_size: characteristicsTable.shoe_size,
      silicone: characteristicsTable.silicone,
      tattoos: characteristicsTable.tattoos,
      piercings: characteristicsTable.piercings,
      smoker: characteristicsTable.smoker,
    })
    .from(characteristicsTable)
    .where(eq(characteristicsTable.companion_id, id))
    .limit(1);

  return result[0];
}

export async function getCompanionById(id: number): Promise<CompanionById> {
  const [details, characteristics, images] = await Promise.all([
    getCompanionDetails(id),
    getCompanionCharacteristics(id),
    getImagesByCompanionId(id),
  ]);

  const imagesUrls = images.images.map((image) => image.publicUrl);

  return {
    ...details,
    ...characteristics,
    images: imagesUrls,
  };
}

export async function getAvailableCities(): Promise<City[]> {
  return await db
    .select({
      id: citiesTable.id,
      city: citiesTable.city,
      state: citiesTable.state,
      country: citiesTable.country,
      slug: citiesTable.slug,
    })
    .from(citiesTable)
    .groupBy(citiesTable.id);
}

export async function getAvailableCitiesSummary(): Promise<CitySummary[]> {
  return await db
    .select({
      slug: citiesTable.slug,
      city: citiesTable.city,
    })
    .from(citiesTable)
    .groupBy(citiesTable.id);
}
