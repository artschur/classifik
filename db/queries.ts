import { setTimeout } from "timers";
import { db } from "./index";
import { companionsTable, type Companion } from "./schema";

// Usar tipo gerado pelo drizzle...
export function getCompanions(): Promise<Companion[]> {
    return db.select().from(companionsTable);
}

export function getSimpleCompanions(): Promise<{ id: number, name: string, price: number, verified: boolean | null, description: string, age: number; }[]> {
    return db.select({ id: companionsTable.id, name: companionsTable.name, price: companionsTable.price, verified: companionsTable.verified, description: companionsTable.description, age: companionsTable.age }).from(companionsTable);
};