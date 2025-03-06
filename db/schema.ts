import { sql } from 'drizzle-orm';
import {
  integer,
  index,
  pgTable,
  serial,
  text,
  boolean,
  decimal,
  varchar,
  timestamp,
  PgArray,
  jsonb,
  json,
} from 'drizzle-orm/pg-core';

export const analyticsEventsTable = pgTable(
  "analytics_events",
  {
    id: serial("id").primaryKey(),
    companionId: integer("companion_id").references(() => companionsTable.id),
    event_type: text("event_type").notNull(), // 'page_view', 'whatsapp_click', etc.
    metadata: json("metadata"),
    created_at: timestamp("created_at").defaultNow(),
    user_agent: text("user_agent"),
    ip_hash: text("ip_hash"), // Store hashed IPs for unique visitor counting
  },
  (table) => ({
    analytics_events_companion_idx: index("analytics_events_companion_idx").on(
      table.companionId
    ),
    analytics_events_type_idx: index("analytics_events_type_idx").on(
      table.event_type
    ),
  })
);

export const companionsTable = pgTable(
  'companions',
  {
    id: serial('id').primaryKey(),
    auth_id: text('auth_id').notNull().unique(),
    name: varchar('name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    instagramHandle: varchar('instagram', { length: 40 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    shortDescription: varchar('short_description', { length: 60 }).notNull(),
    description: text('description').notNull(),
    price: integer('price').notNull(),
    age: integer('age').notNull(),
    gender: varchar('gender', { length: 50 }).notNull(),
    gender_identity: varchar('gender_identity', { length: 100 }),
    languages: text('languages')
      .array()
      .notNull()
      .default(sql`ARRAY[]::TEXT[]`),
    city_id: integer('location_id')
      .notNull()
      .references(() => citiesTable.id),
    neighborhood_id: integer('neighborhood_id').references(
      () => neighborhoodsTable.id
    ),

    verified: boolean('verified').default(false),

    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),

    availability: jsonb('availability').$type<{
      days: string[];
      hours: {
        start: string;
        end: string;
      };
    }>(),

    last_seen: timestamp('last_seen').defaultNow(),
  },
  (table) => ({
    companions_auth_idx: index('companions_auth_idx').on(table.auth_id),
    companions_price_idx: index('companions_price_idx').on(table.price),
    companions_age_idx: index('companions_age_idx').on(table.age),
    companions_verified_idx: index('companions_verified_idx').on(
      table.verified
    ),
    compations_city_idx: index('compations_city_idx').on(table.city_id),
  })
);

export const characteristicsTable = pgTable(
  'characteristics',
  {
    id: serial('id').primaryKey(),
    companion_id: integer('companion_id')
      .references(() => companionsTable.id)
      .notNull(),
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
  },
  (table) => ({
    characteristics_companion_idx: index('characteristics_companion_idx').on(
      table.companion_id
    ),
    characteristics_ethnicity_idx: index('characteristics_ethnicity_idx').on(
      table.ethnicity
    ),
    characteristics_eyes_idx: index('characteristics_eyes_idx').on(
      table.eye_color
    ),
    characteristics_hair_idx: index('characteristics_hair_idx').on(
      table.hair_color
    ),
  })
);

export const reviewsTable = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    companion_id: integer('companion_id')
      .references(() => companionsTable.id)
      .notNull(),
    user_id: text('user_id').notNull(),
    userImageUrl: text('user_image_url'),
    username: text('username').notNull(),
    comment: text('comment').notNull(),
    liked_by: text('liked_by').array().default(sql`ARRAY[]::TEXT[]`),
    rating: integer('rating').notNull().default(5),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
  },
  (table) => ({
    reviews_companion_idx: index('reviews_companion_idx').on(
      table.companion_id
    ),
  })
);

export const citiesTable = pgTable(
  'cities',
  {
    id: serial('id').primaryKey(),
    city: varchar('city', { length: 100 }).notNull(),
    state: varchar('state', { length: 2 }).notNull(),
    country: varchar('country', { length: 100 }).notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
  },
  (table) => ({
    cities_slug_idx: index('cities_slug_idx').on(table.slug),
    cities_city_state_idx: index('cities_city_state_idx').on(
      table.state,
      table.city
    ),
  })
);

export const imagesTable = pgTable(
  'images',
  {
    id: serial('id').primaryKey(),
    authId: text('owner_id'),
    companionId: integer('companion_id').references(() => companionsTable.id).notNull(),
    storage_path: text('storage_path').notNull(),
    public_url: text('public_url').notNull(),
    created_at: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    images_owner_idx: index('images_ownimages_auth_idx').on(table.authId),
    images_companion_idx: index('images_companion_idx').on(table.companionId),
    images_created_idx: index('images_created_idx').on(table.created_at),
  })
);

export const documentsTable = pgTable(
  'documents',
  {
    id: serial('id').primaryKey(),
    authId: text('owner_id').notNull(),
    companionId: integer('companion_id').references(() => companionsTable.id).notNull(),
    document_type: varchar('document_type', { length: 50 }).notNull(), // ID, passport, etc.
    storage_path: text('storage_path').notNull(),
    public_url: text('public_url').notNull(),
    verified: boolean('verified').default(false),
    verification_date: timestamp('verification_date'),
    created_at: timestamp('created_at').defaultNow(),
    updated_at: timestamp('updated_at').defaultNow(),
    notes: text('notes'),
  },
  (table) => ({
    documents_owner_idx: index('documents_auth_idx').on(table.authId),
    documents_companion_idx: index('documents_companion_idx').on(table.companionId),
    documents_type_idx: index('documents_type_idx').on(table.document_type),
  })
);

export const neighborhoodsTable = pgTable(
  'neighborhoods',
  {
    id: serial('id').primaryKey(),
    neighborhood: varchar('neighborhood', { length: 100 }).notNull(),
    city_id: integer('city_id')
      .references(() => citiesTable.id)
      .notNull(),
    slug: varchar('slug', { length: 100 }).notNull(),
  },
  (table) => ({
    neighborhoods_slug_idx: index('neighborhoods_slug_idx').on(table.slug),
    neighborhoods_city_idx: index('neighborhoods_city_idx').on(table.city_id),
  })
);

export type Companion = typeof companionsTable.$inferSelect;
export type NewCompanion = typeof companionsTable.$inferInsert;

export type Characteristic = typeof characteristicsTable.$inferSelect;
export type NewCharacteristic = Omit<
  typeof characteristicsTable.$inferInsert,
  'companion_id'
> & {
  weight: number;
  height: number;
};

export type Review = typeof reviewsTable.$inferSelect;
export type NewReview = typeof reviewsTable.$inferInsert;

export type City = typeof citiesTable.$inferSelect;
export type NewCity = typeof citiesTable.$inferInsert;

export type Neighborhood = typeof neighborhoodsTable.$inferSelect;
export type NewNeighborhood = typeof neighborhoodsTable.$inferInsert;

export type Document = typeof documentsTable.$inferSelect;
export type NewDocument = typeof documentsTable.$inferInsert;
