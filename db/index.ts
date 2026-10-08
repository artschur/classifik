import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { Redis } from '@upstash/redis';

export const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in the environment variables');
}
/**
 * Em desenvolvimento o Next volta a carregar este módulo a cada alteração no
 * código, e cada carga abria um cliente novo (até 10 ligações) sem fechar o
 * anterior. A base aceita 15 ligações no total, partilhadas com o site em
 * produção: ao fim de umas quantas gravações estavam todas presas ao servidor
 * local e o site real começava a falhar. Guardar o cliente no globalThis faz
 * com que o mesmo seja reaproveitado entre cargas.
 */
const globalForDb = globalThis as unknown as {
  pgClient?: ReturnType<typeof postgres>;
};

const client = globalForDb.pgClient ?? postgres(connectionString, { prepare: false });
if (process.env.NODE_ENV !== 'production') globalForDb.pgClient = client;

export const db = drizzle(client);
