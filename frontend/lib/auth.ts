import { betterAuth } from "better-auth";
import { Pool } from "pg";

const HOST = process.env.POSTGRES_URL_BASE;
const USERNAME = process.env.POSTGRES_ADMIN_USERNAME;
const PASSWORD = process.env.POSTGRES_ADMIN_PASSWORD;
const DATABASE_NAME = process.env.POSTGRES_DATABASE_NAME;

export const auth = betterAuth({
  database: new Pool({
    connectionString: `postgres://${USERNAME}:${PASSWORD}@${HOST}/${DATABASE_NAME}`,
  }),
  emailAndPassword: {
    enabled: true,
  },
});