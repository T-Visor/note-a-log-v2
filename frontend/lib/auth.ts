import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING
});

export const auth = betterAuth({
  database: pool,
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24       // 1 day (every 1 day the session expiration is updated)
  },
  emailAndPassword: {
    enabled: true,
  },
});