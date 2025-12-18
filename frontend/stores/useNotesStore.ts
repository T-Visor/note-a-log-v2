import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";

interface NotesStore {
  notes: Note[];
  currentNote: Note | null;
  loadNotes: () => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  setCurrentNote: (newNote: Note | null) => void;
  clearCurrentNote: () => void;
}

const BASE_URL_FOR_COUCHDB_PROXY = process.env.NEXT_PUBLIC_URL_BASE;

// Initialize PouchDB only on client side
let pouchDBClient: any = null;
let remoteCouchDB: any = null;
let syncHandler: any = null;
let initPromise: Promise<void> | null = null;

const getLocalDbName = async () => {
  const response = await fetch(
    "/api/couchdb/meta",
    { credentials: "include" }
  );

  if (!response.ok)
    throw new Error("Not authenticated");

  const { dbName } = await response.json();
  return dbName as string;
};

const getLocalPouchDbKey = async () => {
  const response = await fetch(
    "/api/couchdb/derive-key",
    { credentials: "include" }
  );

  if (!response.ok)
    throw new Error("Not authenticated");

  const { key } = await response.json();
  return key as string;
};

const initializePouchDB = async () => {
  if (typeof window === "undefined")
    return;
  if (pouchDBClient)
    return;
  if (initPromise)
    return initPromise;

  initPromise = (async () => {
    const PouchDB = (await import("pouchdb-browser")).default;
    const cryptoPouchMod = await import("crypto-pouch");

    // Register plugin
    const cryptoPouch = (cryptoPouchMod as any).default ?? (cryptoPouchMod as any);
    if (typeof PouchDB.plugin === "function") {
      PouchDB.plugin(cryptoPouch);
    } 
    else if (typeof cryptoPouch === "function") {
      cryptoPouch(PouchDB);
    }

    const localDbName = await getLocalDbName();
    const localPouchDbKey = await getLocalPouchDbKey();
    pouchDBClient = new PouchDB<Note>(localDbName);
    await pouchDBClient.crypto(localPouchDbKey);

    remoteCouchDB = new PouchDB(`${BASE_URL_FOR_COUCHDB_PROXY}/api/couchdb`);

    pouchDBClient
      .changes({ since: "now", live: true, include_docs: true })
      .on("change", () => useNotesStore.getState().loadNotes());

    syncHandler = PouchDB.sync(pouchDBClient, remoteCouchDB, {
      live: true,
      retry: true,
    }).on("error", (err: any) => console.error("Sync error:", err));
  })();

  return initPromise;
};

const useNotesStore = create<NotesStore>()(
  subscribeWithSelector(
    (set, get) => ({
      notes: [],
      currentNote: null,

      loadNotes: async () => {
        await initializePouchDB();
        if (!pouchDBClient) return;

        const response = await pouchDBClient.allDocs({ include_docs: true });
        const notesList = response.rows.flatMap(
          (row: any) => row.doc ? [row.doc] : []
        );

        set({ notes: notesList });
      },

      addNote: async (newNote: Note) => {
        await initializePouchDB();
        if (!pouchDBClient) return;

        await pouchDBClient.put({
          _id: newNote.id,
          ...newNote
        });
      },

      deleteNote: async (id: string) => {
        await initializePouchDB();
        if (!pouchDBClient) return;

        const noteToDelete = await pouchDBClient.get(id);
        await pouchDBClient.remove(noteToDelete);

        set({
          currentNote: get().currentNote?.id === id
            ? null
            : get().currentNote
        });
      },

      updateNote: async (id: string, updates: Partial<Note>) => {
        await initializePouchDB();
        if (!pouchDBClient) return;

        const noteToUpdate = await pouchDBClient.get(id);
        const updatedNote = { ...noteToUpdate, ...updates };
        await pouchDBClient.put(updatedNote);

        set({
          currentNote: get().currentNote?.id === id
            ? updatedNote
            : get().currentNote
        });
      },

      setCurrentNote: (newNote: Note | null) => {
        set({ currentNote: newNote });
      },

      clearCurrentNote: () => set({ currentNote: null }),
    }),
  )
);

export default useNotesStore;