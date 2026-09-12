## Note-a-Log

Stop searching for your notes. _Schedule them!_

Note-a-log surfaces the right note at the right time so you're always prepared. Schedule a note for a day which will move it to the **Today** section of the sidebar that morning, sorted by time. 

Recurring notes (daily standups, weekly prep lists) show up automatically. When you're done, dismiss it and move on.

**Live application:** <https://note-a-log.vercel.app>

---

### Screenshots
<img width="2255" height="1421" alt="image" src="https://github.com/user-attachments/assets/0ed552ed-96cf-4c9e-a0b5-dfe7dca14042" />


<img width="2255" height="1421" alt="image" src="https://github.com/user-attachments/assets/e59d1b3b-3c6c-4937-aee7-f693565958a7" />

***

## Features
 
### Local-First Architecture
- **Offline-First**: Works completely offline once logged in
- **Sync When Ready**: Seamlessly syncs data when connectivity is restored
### Content Management
- **Tickler System**: Time-based resurfacing of notes on the sidebar allows you to prioritize important ideas
- **Fast Search**: Powered by Orama.js for on-device full-text search
- **Tag Organization**: Easy tagging system for intuitive note categorization and discovery
### Technology Stack
- **Frontend**: Next.js
- **Styling**: Tailwind CSS
- **Database**: PouchDB (local) + IBM Cloudant (remote sync)
- **Search**: Orama.js for local full-text search
- **Rich Text Editing**: BlockNote
- **AI Integration**: Vercel AI SDK
- **State Management**: Zustand
- **Authentication**: Better Auth with PostgreSQL (Neon)
### Unique Capabilities
- **PWA**: Install as an app on any device
- **Free to host**: Runs entirely on free tiers (Vercel + Neon + IBM Cloudant Lite)
---
 
## Architecture Overview
 
Note-a-Log uses a **local-first sync** architecture:
 
```
Browser (PouchDB) ←——————→ IBM Cloudant (per-user DB)
       ↑
       |
  Next.js API
  /api/couchdb/credentials   ← scoped Cloudant API key per user
  /api/couchdb/meta          ← returns local PouchDB DB name
```
 
- Each user gets their own isolated Cloudant database (named by SHA-256 hash of their user ID)
- On first login, a scoped Cloudant API key is provisioned and cached in PostgreSQL
- PouchDB connects **directly** to Cloudant using that key (no proxy needed)
- Sync is live and bidirectional; the app works fully offline using the local PouchDB
---
 
## Prerequisites
 
- Node.js 18+
- A [Neon](https://neon.tech) Postgres database (free tier works)
- An [IBM Cloudant](https://www.ibm.com/cloud/cloudant) instance on the **Lite plan** (free tier works)
- A [Vercel](https://vercel.com) account for deployment (free tier works)
---
 
## Service Setup
 
### 1. Neon (PostgreSQL)
 
1. Create a project at [console.neon.tech](https://console.neon.tech)
2. Copy the connection string from the dashboard
3. Open the **SQL Editor** and run the following to create the credentials cache table:
```sql
CREATE TABLE user_cloudant_credentials (
  user_id TEXT PRIMARY KEY,
  api_key TEXT NOT NULL,
  api_password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```
 
Better Auth will automatically create its own tables (`user`, `session`, etc.) on first run.
 
### 2. IBM Cloudant
 
1. Create an IBM Cloud account at [cloud.ibm.com](https://cloud.ibm.com)
2. Provision a **Cloudant** instance using the **Lite plan** (free)
3. Once provisioned, go to **Service Credentials → New Credential**
4. Copy the following values from the generated credential:
   - `url` → `CLOUDANT_URL`
   - `username` → `CLOUDANT_USERNAME`
   - `password` → `CLOUDANT_PASSWORD`
5. In the Cloudant dashboard, go to **CORS** and enable it for your app's domain (and `localhost` for development)
> **Note:** The Lite plan includes 1 GB storage and 20 reads/writes per second. If you exceed the storage limit, Cloudant blocks new writes (it does not charge you). If you exceed the throughput limit, it returns HTTP 429 and retries automatically.
 
> **Note:** Cloudant API keys are capped at 500 per instance. This app provisions one key per user and caches it in PostgreSQL, so you won't hit this limit under normal usage.
 
### 3. Better Auth
 
Better Auth handles authentication and uses your Neon PostgreSQL database automatically. No additional setup is needed beyond providing the connection string as it will create its tables on the first run.
 
---
 
## Environment Configuration
 
Copy the template and fill in your values:
 
```bash
cp frontend/env-template frontend/.env.local
```
 
Required variables:
 
```bash
# App
NEXT_PUBLIC_URL_BASE=http://YOUR_HOST_URL...  # Your app's base URL
 
# Neon PostgreSQL
POSTGRES_CONNECTION_STRING=postgresql://...
 
# Better Auth
BETTER_AUTH_SECRET=your-secret-here        # Generate with: openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
 
# IBM Cloudant
CLOUDANT_URL=https://<instance>.cloudantnosqldb.appdomain.cloud
CLOUDANT_USERNAME=your-cloudant-username
CLOUDANT_PASSWORD=your-cloudant-password
 
# AI (optional)
# Add your AI provider key here if using AI features
```
 
---
 
## Quick Start
 
```bash
cd frontend
npm install
npm run dev
```
 
### Building for Production
 
```bash
npm run build
npm start
```
 
---
 
## How Sync Works
 
On first login:
1. `/api/couchdb/meta` returns a stable local PouchDB database name for the user
2. `/api/couchdb/credentials` provisions a scoped Cloudant API key (first time only) and returns the remote DB URL + credentials
3. PouchDB connects directly to Cloudant and begins a live bidirectional sync
On subsequent loads:
- The local DB name is cached in `localStorage`. No network call needed
- The Cloudant credentials are cached in Postgres with fast lookup and no re-provisioning
- If the network is unavailable, the app runs fully offline from local PouchDB and syncs automatically when connectivity is restored
---
 
## Cleaning Up Cloudant API Keys
 
Cloudant API keys are not visible in the dashboard. To view or remove them:
 
```bash
# Delete a specific key
curl -X DELETE \
  -u "YOUR_USERNAME:YOUR_PASSWORD" \
  "https://YOUR_INSTANCE.cloudantnosqldb.appdomain.cloud/_api/v2/api_keys/KEY_TO_DELETE"
```
 
To reset all cached credentials (e.g. during development):
 
```sql
TRUNCATE user_cloudant_credentials;
```
 
Users will get fresh keys provisioned on their next login.
 
---
 
## Deployment (Vercel)
 
1. Push your repo to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Set the root directory to `frontend`
4. Add all environment variables from `.env.local` to the Vercel project settings
5. Deploy
The app runs entirely on free tiers:
- **Vercel:** hosting + serverless functions
- **Neon:** Postgres (auth + credential cache)
- **IBM Cloudant:** Per-user CouchDB sync (1 GB free)
