import { stat } from 'fs';
import { db } from './index';
import {
    companionsTable,
    citiesTable,
    type Companion,
    characteristicsTable,
    reviewsTable,
    neighborhoodsTable,
} from './schema';
import { eq } from 'drizzle-orm';
import { CompanionFiltered } from './types';

// Usar tipo gerado pelo drizzle...
export function getCompanions(): Promise<Companion[]> {
    return db.select().from(companionsTable);
}

export function getReviewsByCompanionId(id: number) {
    return db
        .select().from(reviewsTable).where(eq(reviewsTable.companion_id, id));
}

export function getCompanionById(id: number) {
    return db
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

}

export function getSimpleCompanions(city: string): Promise<
    {
        id: number;
        name: string;
        price: number;
        verified: boolean | null;
        description: string;
        age: number;
    }[]
> {
    return db
        .select({
            id: companionsTable.id,
            name: companionsTable.name,
            price: companionsTable.price,
            verified: companionsTable.verified,
            description: companionsTable.description,
            age: companionsTable.age,
        })
        .from(companionsTable)
        .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city))
        .where(eq(citiesTable.slug, city));
}

export async function getAvailableCities() {
    return await db
        .select({
            slug: citiesTable.slug,
            name: citiesTable.city,
            state: citiesTable.state,
            country: citiesTable.country,
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