import { db } from '../index';
import { CompanionFiltered } from '../types';
import {
    companionsTable,
    citiesTable,
    characteristicsTable,
} from '../schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function getCompanionsToFilter(
    city: string,
    filters?: { 
        price: string, 
        age: string, 
        sort: string,
        silicone?: string,
        tattoos?: string,
        hairColor?: string,
        height?: string,
        weight?: string,
        smoker?: string,
        eyeColor?: string,
    }
): Promise<CompanionFiltered[]> {
    const { price, age, sort, silicone, tattoos, hairColor, height, weight, smoker, eyeColor } = filters || {};

    let baseQuery = db
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
        .innerJoin(citiesTable, eq(citiesTable.id, companionsTable.city));

    const conditions = [eq(citiesTable.slug, city)];

    if (price) {
        const [minPrice, maxPrice] = price.split("-");
        if (minPrice) conditions.push(gte(companionsTable.price, parseInt(minPrice)));
        if (maxPrice) conditions.push(lte(companionsTable.price, parseInt(maxPrice)));
    }

    if (age && age !== 'all') {
        const [minAge, maxAge] = age.split("-");
        if (minAge && maxAge) {
            conditions.push(
                gte(companionsTable.age, parseInt(minAge)),
                lte(companionsTable.age, parseInt(maxAge))
            );
        }
    }

    if (hairColor && hairColor !== 'all') {
        const colors = hairColor.split(',');
        if (colors.length > 0) {
            conditions.push(
                sql`LOWER(${characteristicsTable.hair_color}) IN (${sql.join(
                    colors.map(c => sql`LOWER(${c})`),
                    sql`, `
                )})`
            );
        }
    }

    if (eyeColor && eyeColor !== 'all') {
        conditions.push(sql`LOWER(${characteristicsTable.eye_color}) = LOWER(${eyeColor})`);
    }

    if (silicone && silicone !== 'all') {
        conditions.push(eq(characteristicsTable.silicone, silicone === 'true'));
    }

    if (tattoos && tattoos !== 'all') {
        conditions.push(eq(characteristicsTable.tattoos, tattoos === 'true'));
    }

    if (smoker && smoker !== 'all') {
        conditions.push(eq(characteristicsTable.smoker, smoker === 'true'));
    }

    const query = baseQuery
        .where(and(...conditions))
        .orderBy(sort ? 
            (sort.split('-')[1] === 'asc' ? 
                asc(companionsTable[sort.split('-')[0] as 'price' | 'age']) : 
                desc(companionsTable[sort.split('-')[0] as 'price' | 'age'])
            ) : 
            asc(companionsTable.id)
        );

    return query;
}
