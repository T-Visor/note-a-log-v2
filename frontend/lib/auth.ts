import { betterAuth } from "better-auth";
import { Pool } from "pg";

const USERNAME = "user";
const PASSWORD = "password";
const DATABASE_NAME = "users";

export const auth = betterAuth({
  database: new Pool({
    connectionString: `postgres://${USERNAME}:${PASSWORD}@localhost:5432/${DATABASE_NAME}`,
  }),
  emailAndPassword: {
    enabled: true,
  },
});