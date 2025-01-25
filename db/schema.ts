import { integer, index, pgTable, serial, text, boolean, decimal, varchar, timestamp } from 'drizzle-orm/pg-core';

export const companionsTable = pgTable('companions', {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    description: text('description').notNull(),
    price: integer('price').notNull(),
    age: integer('age').notNull(),
    gender: varchar('gender', { length: 50 }).notNull(),
    gender_identity: varchar('gender_identity', { length: 100 }),
    languages: varchar('languages', { length: 255 }),
    verified: boolean('verified').default(false),
    city: integer('location_id').notNull().references(() => citiesTable.id),
    neighborhoodsTable: integer('neighborhood_id').references(() => neighborhoodsTable.id),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
    companions_price_idx: index('companions_price_idx').on(table.price),
    companions_age_idx: index('companions_age_idx').on(table.age),
    companions_verified_idx: index('companions_verified_idx').on(table.verified),
    compations_city_idx: index('compations_city_idx').on(table.city),
}));

export const characteristicsTable = pgTable('characteristics', {
    id: serial('id').primaryKey(),
    companion_id: integer('companion_id').references(() => companionsTable.id).notNull(),
    weight: decimal('weight', { precision: 5, scale: 2 }).notNull(),
    height: decimal('height', { precision: 3, scale: 2 }).notNull(),
    ethnicity: varchar('ethnicity', { length: 50 }).notNull(),
    eye_color: varchar('eye_color', { length: 30 }),
    hair_color: varchar('hair_color', { length: 30 }).notNull(),
    hair_length: varchar('hair_length', { length: 30 }),
    shoe_size: integer('shoe_size'),
    silicone: boolean('silicone').default(false),
    tattoos: boolean('tattoos').default(false),
    piercings: boolean('piercings').default(false),
    smoker: boolean('smoker'),
}, (table) => ({
    characteristics_companion_idx: index('characteristics_companion_idx').on(table.companion_id),
    characteristics_ethnicity_idx: index('characteristics_ethnicity_idx').on(table.ethnicity),
    characteristics_eyes_idx: index('characteristics_eyes_idx').on(table.eye_color),
    characteristics_hair_idx: index('characteristics_hair_idx').on(table.hair_color)
}));

export const reviewsTable = pgTable('reviews', {
    id: serial('id').primaryKey(),
    companion_id: integer('companion_id').references(() => companionsTable.id).notNull(),
    user_id: text('user_id').notNull(),
    comment: text('comment').notNull(),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
}, (table) => ({
    reviews_companion_idx: index('reviews_companion_idx').on(table.companion_id)
}));

export const citiesTable = pgTable('locations', {
    id: serial('id').primaryKey(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 2 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
}, (table) => ({
    cities_slug_idx: index('cities_slug_idx').on(table.slug),
    cities_city_state_idx: index('cities_city_state_idx').on(table.state, table.city),
}));

export const neighborhoodsTable = pgTable('neighborhoods', {
    id: serial('id').primaryKey(),
    neighborhood: varchar('neighborhood', { length: 100 }).notNull(),
    city: integer('city_id').references(() => citiesTable.id).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
}, (table) => ({
    neighborhoods_slug_idx: index('neighborhoods_slug_idx').on(table.slug),
    neighborhoods_city_idx: index('neighborhoods_city_idx').on(table.city)
}));



export type Companion = typeof companionsTable.$inferSelect;
export type NewCompanion = typeof companionsTable.$inferInsert;

export type Characteristic = typeof characteristicsTable.$inferSelect;
export type NewCharacteristic = typeof characteristicsTable.$inferInsert;

export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;

export type City = typeof citiesTable.$inferSelect;
export type NewCity = typeof citiesTable.$inferInsert;

export type Neighborhood = typeof neighborhoodsTable.$inferSelect;
export type NewNeighborhood = typeof neighborhoodsTable.$inferInsert;