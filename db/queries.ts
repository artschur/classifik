import { setTimeout } from 'timers';
import { db } from './index';
import { companionsTable, locationsTable, type Companion } from './schema';
import { eq } from 'drizzle-orm';

// Usar tipo gerado pelo drizzle...
export function getCompanions(): Promise<Companion[]> {
    return db.select().from(companionsTable);
}

export function getSimpleCompanions(
    city: string
): Promise<
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
        .innerJoin(locationsTable, eq(locationsTable.companion_id, companionsTable.id))
        .where(eq(locationsTable.city, city));
}
