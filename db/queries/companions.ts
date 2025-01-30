import { db } from '../index';
import { CompanionFiltered, FilterTypesCompanions } from '../types';
import {
    companionsTable,
    citiesTable,
    characteristicsTable,
} from '../schema';
import { eq, and, gte, lte, desc, asc, SQL } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export async function getCompanionsToFilter(
    city: string,
    filters?: FilterTypesCompanions
): Promise<CompanionFiltered[]> {
    const { price, age, sort, silicone, tattoos, hairColor, height, weight, smoker, eyeColor } = filters || {};

    // Collect all conditions
    const conditions: SQL[] = [eq(citiesTable.slug, city)];

    // Add companion table conditions
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

    // Add characteristics table conditions
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

    if (silicone) {
        console.log(typeof(silicone));
        conditions.push(sql`${characteristicsTable.silicone} = ${Boolean(silicone)}`);
    }

    if (tattoos) {
        conditions.push(eq(characteristicsTable.tattoos, tattoos === true));
    }

    if (smoker && smoker !== 'all') {
        conditions.push(eq(characteristicsTable.smoker, smoker === 'true'));
    }

    // Build the query with a single where clause
    return db
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
            citiesTable, 
            eq(citiesTable.id, companionsTable.city)
        )
        .innerJoin(
            characteristicsTable,
            eq(characteristicsTable.companion_id, companionsTable.id)
        )
        .where(and(...conditions))
        .orderBy(
            sort ? 
                (sort.split('-')[1] === 'asc' ? 
                    asc(companionsTable[sort.split('-')[0] as 'price' | 'age']) : 
                    desc(companionsTable[sort.split('-')[0] as 'price' | 'age'])
                ) : 
                asc(companionsTable.id)
        );
}