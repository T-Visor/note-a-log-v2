## Note-a-Log

Note-a-Log is a personal knowledge management system designed to help you capture and prioritize information effortlessly. Its standout feature is a dynamic sidebar that resurfaces scheduled ideas exactly when you need them, ensuring you stay focused on what matters most.

**Live application:** <https://note-a-log.vercel.app>

***

## Features

### Local-First Architecture

* **Offline-First**: Works completely offline once logged in

* **Sync When Ready**: Seamlessly syncs data when connectivity is restored

### Smart Note Management

* **Tickler System**: Time-based resurfacing of notes on the sidebar allows you to prioritize important ideas

* **Fast Search**: Powered by Orama for lightning-quick, on-device full-text search across your notes

* **Tag Organization**: Easy tagging system for intuitive note categorization and discovery

### Progressive Web App

* **PWA Ready**: Install as an app on any device (desktop, tablet, mobile)

* **App-Like Experience**: Responsive design that works seamlessly across all screen sizes

### Technology Stack

* **Frontend Framework**: Next.js

* **Styling**: Tailwind CSS

* **Database**: PouchDB with CouchDB backend

* **Search**: Orama.js for local full-text search

* **Rich Text Editing**: BlockNote with AI capabilities

* **AI Integration**: Vercel AI SDK

* **State Management**: Zustand

* **Authentication**: Better Auth with PostgreSQL

### Unique Capabilities

* **AI-Powered Writing**: Built-in AI assistance for note enhancement and content generation

* **Natural Language Parsing**: Chrono-node integration for intelligent date parsing in notes

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
