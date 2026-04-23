import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import crypto from "crypto";
import { pool as DATABASE_CONNECTION_POOL } from "@/lib/auth";

const CLOUDANT_URL = process.env.CLOUDANT_URL;
const CLOUDANT_USERNAME = process.env.CLOUDANT_USERNAME;
const CLOUDANT_PASSWORD = process.env.CLOUDANT_PASSWORD;

const cloudantAdminCredentials = () => {
  return "Basic " + Buffer.from(
    `${CLOUDANT_USERNAME}:${CLOUDANT_PASSWORD}`
  ).toString("base64");
};

const getDatabaseNameFromUserID = (userId: string) => {
  return "u_" + crypto.createHash("sha256").update(userId).digest("hex");
};

const cloudantFetch = (
  path: string,
  options: RequestInit = {}
) => {
  return fetch(`${CLOUDANT_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": cloudantAdminCredentials(),
      ...(options.headers ?? {}),
    },
  });
};

const ensureUserDatabaseExists = async (databaseName: string) => {
  const response = await cloudantFetch(`/${databaseName}`);
  if (response.status === 404)
    await cloudantFetch(`/${databaseName}`, { method: "PUT" });
};

const provisionUserAPIKey = async (databaseName: string) => {
  const keyResponse = await cloudantFetch("/_api/v2/api_keys", { method: "POST" });
  if (!keyResponse.ok)
    throw new Error("Failed to generate Cloudant API key");

  const { key, password } = await keyResponse.json();

  const permissionResponse = await cloudantFetch(`/_api/v2/db/${databaseName}/_security`, {
    method: "PUT",
    body: JSON.stringify({
      cloudant: { [key]: ["_reader", "_writer"] },
    }),
  });

  if (!permissionResponse.ok)
    throw new Error("Failed to set Cloudant API key permissions");

  return { key, password };
};

const getOrProvisionCredentials = async (
  userId: string,
  databaseName: string
) => {
  // Check for existing cached credentials
  const { rows } = await DATABASE_CONNECTION_POOL.query(
    "SELECT api_key, api_password FROM user_cloudant_credentials WHERE user_id = $1",
    [userId]
  );

  // Return cached credentials if they exist
  if (rows.length > 0)
    return { key: rows[0].api_key, password: rows[0].api_password };

  // Otherwise, provision new credentials
  await ensureUserDatabaseExists(databaseName);
  const { key, password } = await provisionUserAPIKey(databaseName);

  // Cache these credentials
  await DATABASE_CONNECTION_POOL.query(
    `INSERT INTO user_cloudant_credentials (user_id, api_key, api_password)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, key, password]
  );

  return { key, password };
};

export const GET = async (request: NextRequest) => {
  // Check for active session.
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  // Derive per-user database name from user ID 
  const databaseName = getDatabaseNameFromUserID(session.user.id);

  // Retrieve credentials for the user.
  const { key, password } = await getOrProvisionCredentials(session.user.id, databaseName);

  return NextResponse.json({
    url: `${CLOUDANT_URL}/${databaseName}`,
    username: key,
    password,
  });
};