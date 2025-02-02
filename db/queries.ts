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
import { CitySummary, CompanionById, CompanionFiltered } from './types';

export function getReviewsByCompanionId(id: number): Promise<Review[]> {
    return db
        .select().from(reviewsTable).where(eq(reviewsTable.companion_id, id));
}

export async function getCompanionById(id: number): Promise<CompanionById> {
    const result = await db
        .select({
            id: companionsTable.id,
            name: companionsTable.name,
            price: companionsTable.price,
            verified: companionsTable.verified,
            description: companionsTable.description,
            age: companionsTable.age,
            city: citiesTable.city,
            weight: characteristicsTable.weight,
            height: characteristicsTable.height,
            ethnicity: characteristicsTable.ethnicity,
            eyeColor: characteristicsTable.eye_color,
            hairColor: characteristicsTable.hair_color,
            silicone: characteristicsTable.silicone,
            tattoos: characteristicsTable.tattoos,
            piercings: characteristicsTable.piercings,
            smoker: characteristicsTable.smoker,
        })
        .from(companionsTable)
        .where(eq(companionsTable.id, id))
        .innerJoin(
            characteristicsTable,
            eq(companionsTable.id, characteristicsTable.companion_id)
        ).leftJoin(citiesTable, eq(citiesTable.id, companionsTable.city))
        .limit(1);

    return result[0] as CompanionById;
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
        .from(citiesTable).groupBy(citiesTable.id);
}

export async function getAvailableCitiesSummary(): Promise<CitySummary[]> {
    return await db
        .select({
            slug: citiesTable.slug,
            city: citiesTable.city,
        })
        .from(citiesTable).groupBy(citiesTable.id);
}

export async function getCompanionsToFilter(city: string): Promise<CompanionFiltered[]> {
    const results = await db
        .select({
            id: companionsTable.id,
            name: companionsTable.name,
            description: companionsTable.description,
            price: companionsTable.price,
            age: companionsTable.age,
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
        .innerJoin(
            characteristicsTable,
            eq(characteristicsTable.companion_id, companionsTable.id)
        )
        .innerJoin(
            citiesTable,
            eq(citiesTable.id, companionsTable.city)
        )
        .where(eq(citiesTable.slug, city));

    return results as CompanionFiltered[];
}