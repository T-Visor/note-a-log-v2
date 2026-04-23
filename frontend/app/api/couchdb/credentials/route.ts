import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Pool } from "pg";
import crypto from "crypto";

const pool = new Pool({ connectionString: process.env.POSTGRES_CONNECTION_STRING });

const CLOUDANT_URL = process.env.CLOUDANT_URL;
const CLOUDANT_USERNAME = process.env.CLOUDANT_USERNAME;
const CLOUDANT_PASSWORD = process.env.CLOUDANT_PASSWORD;

const cloudantAdminAuth = () =>
  "Basic " + Buffer.from(`${CLOUDANT_USERNAME}:${CLOUDANT_PASSWORD}`).toString("base64");

const couchDbNameFromUserId = (userId: string) =>
  "u_" + crypto.createHash("sha256").update(userId).digest("hex");

const cloudantFetch = (path: string, options: RequestInit = {}) =>
  fetch(`${CLOUDANT_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": cloudantAdminAuth(),
      ...(options.headers ?? {}),
    },
  });

const ensureDbExists = async (dbName: string) => {
  const res = await cloudantFetch(`/${dbName}`);
  if (res.status === 404)
    await cloudantFetch(`/${dbName}`, { method: "PUT" });
};

const provisionUserApiKey = async (dbName: string) => {
  const keyRes = await cloudantFetch("/_api/v2/api_keys", { method: "POST" });
  if (!keyRes.ok)
    throw new Error("Failed to generate Cloudant API key");

  const { key, password } = await keyRes.json();

  const permRes = await cloudantFetch(`/_api/v2/db/${dbName}/_security`, {
    method: "PUT",
    body: JSON.stringify({
      cloudant: { [key]: ["_reader", "_writer"] },
    }),
  });

  if (!permRes.ok)
    throw new Error("Failed to set Cloudant API key permissions");

  return { key, password };
};

const getOrProvisionCredentials = async (userId: string, dbName: string) => {
  // Check for existing cached credentials
  const { rows } = await pool.query(
    "SELECT api_key, api_password FROM user_cloudant_credentials WHERE user_id = $1",
    [userId]
  );

  if (rows.length > 0)
    return { key: rows[0].api_key, password: rows[0].api_password };

  // Provision new credentials
  await ensureDbExists(dbName);
  const { key, password } = await provisionUserApiKey(dbName);

  // Cache them
  await pool.query(
    `INSERT INTO user_cloudant_credentials (user_id, api_key, api_password)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO NOTHING`,
    [userId, key, password]
  );

  return { key, password };
};

export const GET = async (request: NextRequest) => {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const dbName = couchDbNameFromUserId(session.user.id);

  const { key, password } = await getOrProvisionCredentials(session.user.id, dbName);

  return NextResponse.json({
    url: `${CLOUDANT_URL}/${dbName}`,
    username: key,
    password,
  });
};