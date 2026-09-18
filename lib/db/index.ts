import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: NeonHttpDatabase<typeof schema> | null = null;

export const db: NeonHttpDatabase<typeof schema> = new Proxy(
  {} as NeonHttpDatabase<typeof schema>,
  {
    get(_target, prop) {
      if (!_db) {
        const url = process.env.POSTGRES_URL ?? process.env.yomtob_database_POSTGRES_URL;
        if (!url) {
          throw new Error(
            "POSTGRES_URL is not set — database operations are unavailable",
          );
        }
        const sql = neon(url);
        _db = drizzle(sql, { schema });
      }
      return (_db as unknown as Record<string | symbol, unknown>)[prop];
    },
  },
);
