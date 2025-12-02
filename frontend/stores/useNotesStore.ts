import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";
import PouchDB from "pouchdb";

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

const pouchDBClient = new PouchDB<Note>("lumenative-notes");
const remoteCouchDB = new PouchDB("http://admin:admin@127.0.0.1:5984/lumenative-notes");

const useNotesStore = create<NotesStore>()(
  subscribeWithSelector(
    (set, get) => ({
      notes: [],
      currentNote: null,

      loadNotes: async() => {
        const response = await pouchDBClient.allDocs({ include_docs: true });
        const notesList = response.rows.flatMap(
          row => row.doc ? [row.doc] : []
        );

        set({ notes: notesList });
      },

      addNote: async (newNote: Note) => {
        await pouchDBClient.put({
          _id: newNote.id,
          ...newNote
        });
      },

      deleteNote: async (id: string) => {
        const noteToDelete = await pouchDBClient.get(id);
        await pouchDBClient.remove(noteToDelete);

        set({
          currentNote: get().currentNote?.id === id
            ? null
            : get().currentNote
        });
      },

      updateNote: async (id: string, updates: Partial<Note>) => {
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

// Sync across tabs and windows
pouchDBClient.changes({ 
  since: "now", 
  live: true, 
  include_docs: true 
}).on("change", () => {
    useNotesStore.getState().loadNotes();
  }
);

// Live sync with CouchDB
PouchDB.sync(pouchDBClient, remoteCouchDB, {
  live: true,
  retry: true
})
.on("change", info => {
  console.log("Sync change:", info);
})
.on("paused", err => {
  console.log("Sync paused. Possibly waiting for changes.", err);
})
.on("active", () => {
  console.log("Sync resumed");
})
.on("error", err => {
  console.error("Sync error:", err);
});


export default useNotesStore;