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

const baseURL = process.env.NEXT_PUBLIC_URL ?? "http://localhost:3000";
const DATABASE_NAME = "lumenative-notes";

// Initialize PouchDB only on client side
let pouchDBClient: any = null;
let remoteCouchDB: any = null;
let syncHandler: any = null;

const initializePouchDB = async () => {
  if (typeof window === 'undefined') return;
  if (pouchDBClient) return; // Already initialized

  const PouchDB = (await import("pouchdb-browser")).default;
  
  pouchDBClient = new PouchDB<Note>(DATABASE_NAME);
  remoteCouchDB = new PouchDB(`${baseURL}/api/couchdb/${DATABASE_NAME}`);

  // Set up live changes listener
  pouchDBClient.changes({ 
    since: "now", 
    live: true, 
    include_docs: true 
  }).on("change", () => {
    useNotesStore.getState().loadNotes();
  });

  // Set up sync with CouchDB
  syncHandler = PouchDB.sync(pouchDBClient, remoteCouchDB, {
    live: true,
    retry: true
  })
  .on("change", (info: any) => {
    console.log("Sync change:", info);
  })
  .on("paused", (err: any) => {
    console.log("Sync paused. Possibly waiting for changes.", err);
  })
  .on("active", () => {
    console.log("Sync resumed");
  })
  .on("error", (err: any) => {
    console.error("Sync error:", err);
  });
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