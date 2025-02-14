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

export function getReviewsByCompanionId(id: number): Promise<Review[]> {
  return db
    .select()
    .from(reviewsTable)
    .where(eq(reviewsTable.companion_id, id));
}

export async function getCompanionById(id: number): Promise<CompanionById> {
  const result = await db
    .select({
      name: companionsTable.name,
      email: companionsTable.email,
      phone: companionsTable.phone,
      price: companionsTable.price,
      verified: companionsTable.verified,
      shortDescription: companionsTable.shortDescription,
      description: companionsTable.description,
      age: companionsTable.age,
      gender: companionsTable.gender,
      gender_identity: companionsTable.gender_identity,
      languages: companionsTable.languages,
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
      last_seen: companionsTable.last_seen,
    })
    .from(companionsTable)
    .where(eq(companionsTable.id, id))
    .innerJoin(
      characteristicsTable,
      eq(companionsTable.id, characteristicsTable.companion_id)
    )
    .limit(1);
  const images: {} = await getImagesByCompanionId(id);
  const imageUrls = (images as { publicUrl: string }[]).map(
    (image) => image.publicUrl
  );

  return {
    ...result[0],
    images: imageUrls,
  } as CompanionById;
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
