## Note-a-Log

Stop searching for your notes. _Schedule them!_

Note-a-log surfaces the right note at the right time so you're always prepared. Schedule a note for a day which will move it to the **Today** section of the sidebar that morning, sorted by time. 

Recurring notes (daily standups, weekly prep lists) show up automatically. When you're done, dismiss it and move on.

**Live application:** <https://note-a-log.vercel.app>

---

### Screenshot

<img width="2255" height="1421" alt="image" src="https://github.com/user-attachments/assets/e59d1b3b-3c6c-4937-aee7-f693565958a7" />

***

## Features

### Local-First Architecture

* **Offline-First**: Works completely offline once logged in

* **Sync When Ready**: Seamlessly syncs data when connectivity is restored

### Content Management

* **Tickler System**: Time-based resurfacing of notes on the sidebar allows you to prioritize important ideas

* **Fast Search**: Powered by Orama.js for on-device full-text search

* **Tag Organization**: Easy tagging system for intuitive note categorization and discovery

### Technology Stack

* **Frontend**: Next.js

* **Styling**: Tailwind CSS

* **Database**: PouchDB with CouchDB backend

* **Search**: Orama.js for local full-text search

* **Rich Text Editing**: BlockNote

* **AI Integration**: Vercel AI SDK

* **State Management**: Zustand

* **Authentication**: Better Auth with PostgreSQL

### Unique Capabilities

* **PWA:&#x20;**&#x49;nstall as an app on any device

***

## Environment Configuration

Note-a-Log requires several environment variables to be configured. Copy `frontend/env-template` to `.env.local` and fill in the values:

```text
cp frontend/env-template frontend/.env.local
```

***

## Quick Start

```text
npm run dev
```

### Building for Production

```text
npm run build
npm start
```
