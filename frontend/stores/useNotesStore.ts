import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";
import { create as createOrama, insertMultiple, save, load, insert, remove, upsert } from "@orama/orama";
import { stemmer, language } from "@orama/stemmers/english";

interface NotesStore {
  notes: Note[];
  currentNote: Note | null;
  loadNotes: () => Promise<void>;
  loadSingleNote: (id: string) => Promise<void>;
  addNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  setCurrentNote: (newNote: Note | null) => void;
  setCurrentNoteUsingID: (id: string) => Promise<void>;
  clearCurrentNote: () => void;
  oramaIndex: any | null;
  // Internal helpers for surgical change handling
  upsertNoteInState: (note: Note) => void;
  removeNoteFromState: (id: string) => void;
}

const BASE_URL_FOR_COUCHDB_PROXY = process.env.NEXT_PUBLIC_URL_BASE;
export const POUCHDB_LOCAL_DB_NAME_KEY = "pouchdb-local-db-name";

// Initialize PouchDB only on client side
let pouchDBClient: any = null;
let remoteCouchDB: any = null;
let syncHandler: any = null;
let initPromise: Promise<void> | null = null;

const getLocalDbName = async () => {
  const cached = localStorage.getItem(POUCHDB_LOCAL_DB_NAME_KEY);
  if (cached)
    return cached;

  const response = await fetch(
    "/api/couchdb/meta",
    { credentials: "include" }
  );

  if (!response.ok)
    throw new Error("Not authenticated");

  const { dbName } = await response.json();
  localStorage.setItem(POUCHDB_LOCAL_DB_NAME_KEY, dbName); // cache for next time
  return dbName as string;
};

const initializePouchDB = async () => {
  if (typeof window === "undefined" || pouchDBClient)
    return;
  if (initPromise)
    return initPromise;

  initPromise = (async () => {
    const PouchDB = (await import("pouchdb-browser")).default;
    const upsertPouchMod = await import("pouchdb-upsert");
    PouchDB.plugin(upsertPouchMod);

    const localDbName = await getLocalDbName();
    pouchDBClient = new PouchDB(localDbName);

    pouchDBClient.changes({
      since: "now",
      live: true,
      include_docs: true
    }).on("change", (change: any) => {
      const store = useNotesStore.getState();

      if (change.deleted) 
        store.removeNoteFromState(change.id);
      else 
        store.upsertNoteInState({ ...change.doc, id: change.doc._id });
    }).on("error", (err: any) => {
      console.warn("Changes feed error:", err);
    });

    setupRemoteSync(PouchDB);
  })();

  return initPromise;
};

const initializePouchDBSingleNote = async () => {
  if (typeof window === "undefined" || pouchDBClient)
    return;
  if (initPromise)
    return initPromise;

  initPromise = (async () => {
    const PouchDB = (await import("pouchdb-browser")).default;
    const upsertPouchMod = await import("pouchdb-upsert");
    PouchDB.plugin(upsertPouchMod);

    const localDbName = await getLocalDbName();
    pouchDBClient = new PouchDB(localDbName);

    pouchDBClient.changes({
      since: "now",
      live: true,
      include_docs: true
    }).on("change", () => console.log("local note changed."));

    setupRemoteSync(PouchDB);
  })();

  return initPromise;
};

const setupRemoteSync = async (PouchDB: any) => {
  try {
    remoteCouchDB = new PouchDB(`${BASE_URL_FOR_COUCHDB_PROXY}/api/couchdb`);

    syncHandler = pouchDBClient.sync(remoteCouchDB, {
      live: true,
      retry: true,
      back_off_function: (delay: number) => Math.min(delay * 2, 60000)
    });

    syncHandler.on(
      "error",
      (error: any) => console.warn("Sync paused:", error)
    );
  }
  catch (error) {
    console.error("Remote sync setup failed:", error);
  }
};

const useNotesStore = create<NotesStore>()(
  subscribeWithSelector(
    (set, get) => ({
      notes: [],
      currentNote: null,
      oramaIndex: null,

      // Surgically insert or update a single note in state and the Orama index.
      // Called by the changes feed instead of a full loadNotes() reload.
      upsertNoteInState: (note: Note) => {
        const { notes, oramaIndex, currentNote } = get();
        const exists = notes.some(n => n.id === note.id);

        // Patch the Orama index: remove stale entry (if any) then re-insert
        if (oramaIndex) {
          if (exists) {
            // remove() targets the internal Orama document id, which we set
            // equal to the note id during insertMultiple — so this is safe.
            remove(oramaIndex, note.id);
          }
          insert(oramaIndex, {
            id: note.id,
            title: note.title,
            content: note.content,
            tags: note.tags,
            location: note.location,
          });
        }

        // Patch the notes array: replace or prepend
        const updatedNotes = exists
          ? notes.map(n => n.id === note.id ? note : n)
          : [note, ...notes];

        set({
          notes: updatedNotes,
          // Keep currentNote in sync if it's the note that just changed
          currentNote: currentNote?.id === note.id ? note : currentNote,
        });
      },

      // Surgically remove a single note from state and the Orama index.
      removeNoteFromState: (id: string) => {
        const { oramaIndex, currentNote } = get();

        if (oramaIndex) {
          remove(oramaIndex, id);
        }

        set((state) => ({
          notes: state.notes.filter(n => n.id !== id),
          currentNote: currentNote?.id === id ? null : currentNote,
        }));
      },

      loadSingleNote: async (id: string) => {
        await initializePouchDBSingleNote();
        if (!pouchDBClient)
          return;

        const note: Note = await pouchDBClient.get(id);
        set({ currentNote: note });
      },

      loadNotes: async () => {
        await initializePouchDB();
        if (!pouchDBClient)
          return;

        // Get all notes from PouchDB
        const response = await pouchDBClient.allDocs({ include_docs: true, conflicts: true });
        const notesList = response.rows
          .filter((row: any) => !row.id.startsWith("_")) // Ignore system docs
          .map((row: any) => ({
            ...row.doc,
            id: row.doc._id, // Explicitly map PouchDB _id to your UI's id
          }));

        // Sort notes list for displaying on the UI
        const sortedNotesList = [...notesList].sort(
          (left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt)
        );

        // Create search index and populate with notes data
        const index = createOrama({
          schema: {
            title: "string",
            content: "string",
            tags: "string[]",
            location: "string"
          },
          components: {
            tokenizer: {
              stemming: true,
              language,
              stemmer,
            },
          },
        });
        const searchableNotes = sortedNotesList.map(({ id, title, content, tags, location }: Note) => ({
          id,
          title,
          content,
          tags,
          location
        }));
        insertMultiple(index, searchableNotes);

        set({
          notes: sortedNotesList,
          oramaIndex: index
        });
      },

      addNote: async (newNote: Note) => {
        if (!pouchDBClient)
          return;

        await pouchDBClient.upsert(newNote.id, (noteToAdd: any) => ({ ...newNote }));

        // Update the UI immediately (changes feed will also fire but
        // upsertNoteInState is idempotent so the duplicate is harmless)
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
      },

      deleteNote: async (id: string) => {
        // Immediately remove from UI (optimistic update)
        // removeNoteFromState handles both the notes array and the Orama index
        get().removeNoteFromState(id);

        if (!pouchDBClient)
          return;

        try {
          // Then do the actual deletion
          const noteToDelete = await pouchDBClient.get(id, { conflicts: true });
          await pouchDBClient.remove(noteToDelete);

          // Delete all conflicts
          if (noteToDelete._conflicts && noteToDelete._conflicts.length > 0) {
            for (const conflictRev of noteToDelete._conflicts) {
              try {
                await pouchDBClient.remove(id, conflictRev);
              }
              catch (error) {
                console.error(`Failed to delete conflict ${conflictRev}:`, error);
              }
            }
          }
        }
        catch (error) {
          console.error("Error deleting note:", error);
          // Rollback: reload notes if deletion failed
          await get().loadNotes();
        }
      },

      updateNote: async (id: string, updates: Partial<Note>) => {
        if (!pouchDBClient)
          return;

        try {
          await pouchDBClient.upsert(id, (doc: any) => {
            const updated = {
              ...doc,
              ...updates,
              updatedAt: new Date().toISOString(),
            };
            return updated;
          });

          // Get the fresh doc with new _rev
          const updatedDoc = await pouchDBClient.get(id);
          const note = { ...updatedDoc, id: updatedDoc._id };

          // upsertNoteInState handles notes array, Orama index, and currentNote
          get().upsertNoteInState(note);
        }
        catch (error) {
          console.error("Error updating note:", error);
        }
      },

      setCurrentNote: (newNote: Note | null) => {
        set({ currentNote: newNote });
      },

      setCurrentNoteUsingID: async (id: string) => {
        if (!pouchDBClient)
          return;

        const note: Note = await pouchDBClient.get(id);
        if (note)
          set({ currentNote: note });
      },

      clearCurrentNote: () => set({ currentNote: null }),
    }),
  )
);

export default useNotesStore;