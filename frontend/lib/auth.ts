import { betterAuth } from "better-auth";
import { Pool } from "pg";

export const pool = new Pool({
  connectionString: process.env.POSTGRES_CONNECTION_STRING
});

export const auth = betterAuth({
  database: pool,
  emailAndPassword: {
    enabled: true,
  },
});