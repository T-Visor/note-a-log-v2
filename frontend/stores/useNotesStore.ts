import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";
import { create as createOrama, insertMultiple, insert, remove } from "@orama/orama";
import { stemmer, language } from "@orama/stemmers/english";
import { pluginQPS } from "@orama/plugin-qps";
import { pluginPT15 } from '@orama/plugin-pt15'

let LOCAL_POUCH_CLIENT: any = null;
let REMOTE_COUCHDB: any = null;
let SYNC_HANDLER_POUCHDB: any = null;
export const POUCHDB_LOCAL_DB_NAME_KEY = "pouchdb-local-db-name";

interface NotesStore {
  notes: Note[];
  currentNote: Note | null;

  // Fetching notes
  loadNotes: () => Promise<void>;
  loadSingleNote: (id: string) => Promise<void>;

  // Note operations
  addNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;

  // Helpers for displaying the current note in the editor
  setCurrentNote: (newNote: Note | null) => void;
  setCurrentNoteUsingID: (id: string) => Promise<void>;
  clearCurrentNote: () => void;

  // Internal helpers for surgical change handling
  upsertNoteInState: (note: Note) => void;
  removeNoteFromState: (id: string) => void;

  // On-device search index for notes
  oramaIndex: any | null;
}

export const resetPouchDBOnLogout = () => {
  if (SYNC_HANDLER_POUCHDB) {
    SYNC_HANDLER_POUCHDB.cancel();
    SYNC_HANDLER_POUCHDB = null;
  }
  LOCAL_POUCH_CLIENT = null;
  REMOTE_COUCHDB = null;
};

const getDBNameForLocalPouchClient = async () => {
  // If the PouchDB database name has been cached in local storage, use that value.
  const cached = localStorage.getItem(POUCHDB_LOCAL_DB_NAME_KEY);
  if (cached)
    return cached;

  // Otherwise, call the endpoint to retrieve the PouchDB database name for the current user.
  const response = await fetch("/api/couchdb/meta", { credentials: "include" });
  if (!response.ok)
    throw new Error("Not authenticated");

  // Cache the PouchDB database name from the endpoint and return the value.
  const { dbName } = await response.json();
  localStorage.setItem(POUCHDB_LOCAL_DB_NAME_KEY, dbName); // cache for next time
  return dbName as string;
};

const initializePouchDBSync = async () => {
  // return immediately if running on the server-side or PouchDB is already initialized.
  if (typeof window === "undefined" || LOCAL_POUCH_CLIENT)
    return;

  // Import if we are in the browser environment.
  const PouchDB = (await import("pouchdb-browser")).default;
  const upsertCouchDBMod = await import("pouchdb-upsert");
  PouchDB.plugin(upsertCouchDBMod);

  // Set-up the PouchDB client,
  // including handlers when removing or adding a note.
  const localDBNameForPouchClient = await getDBNameForLocalPouchClient();
  LOCAL_POUCH_CLIENT = new PouchDB(localDBNameForPouchClient);
  LOCAL_POUCH_CLIENT.changes({
    since: "now",
    live: true,
    include_docs: true
  }).on("change", (change: any) => {
    const store = useNotesStore.getState();
    if (change.deleted)
      store.removeNoteFromState(change.id);
    else
      store.upsertNoteInState({ ...change.doc, id: change.doc._id });
  });

  try {
    // Set-up the remote CouchDB connection
    const { url, username, password } = await fetch(
      '/api/couchdb/credentials'
    ).then(
      response => response.json()
    );
    REMOTE_COUCHDB = new PouchDB(url, {
      auth: { username, password }
    });

    // Sync between local and remote.
    SYNC_HANDLER_POUCHDB = LOCAL_POUCH_CLIENT.sync(REMOTE_COUCHDB, {
      live: true,
      retry: true,
      back_off_function: (delay: number) => Math.min(delay * 2, 6000) // 2 minute back off
    });
  }
  catch (error) {
    console.error("Failed to initialize sync:", error);
  }
};

const useNotesStore = create<NotesStore>()(
  subscribeWithSelector(
    (set, get) => ({
      notes: [],
      currentNote: null,
      oramaIndex: null,

      loadNotes: async () => {
        // Instantiate PouchDB/CouchDB
        await initializePouchDBSync();
        if (!LOCAL_POUCH_CLIENT)
          return;

        // Get all notes stored in PouchDB
        const response = await LOCAL_POUCH_CLIENT.allDocs({ include_docs: true, conflicts: true });
        const notesList = response.rows
          .filter((row: any) => !row.id.startsWith("_")) // Ignore system docs
          .map((row: any) => ({
            ...row.doc,
            id: row.doc._id, // Explicitly map PouchDB _id to your UI's id
          }));

        // Sort notes in descending order for the UI
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
          plugins: [pluginPT15()],
          components: {
            tokenizer: { stemming: true, language, stemmer }
          }
        });

        // Extract a subset of searchable fields from each note and insert into the index 
        const searchableNotes = sortedNotesList.map(({
          id, title, content, tags, location
        }: Note) => (
          { id, title, content, tags, location }
        ));
        insertMultiple(index, searchableNotes);

        set({
          notes: sortedNotesList,
          oramaIndex: index
        });
      },

      loadSingleNote: async (id: string) => {
        // Instantiate PouchDB/CouchDB
        await initializePouchDBSync();
        if (!LOCAL_POUCH_CLIENT)
          return;

        const note: Note = await LOCAL_POUCH_CLIENT.get(id);
        set({ currentNote: note });
      },

      addNote: async (newNote: Note) => {
        await LOCAL_POUCH_CLIENT.upsert(newNote.id, (noteToAdd: any) => ({ ...newNote }));

        // Sync change with state.
        get().upsertNoteInState(newNote);
      },

      deleteNote: async (id: string) => {
        // Optimistically remove from state
        get().removeNoteFromState(id);

        try {
          // Then do the actual deletion
          const noteToDelete = await LOCAL_POUCH_CLIENT.get(id, { conflicts: true });
          await LOCAL_POUCH_CLIENT.remove(noteToDelete);

          // Delete all conflicts
          if (noteToDelete._conflicts && noteToDelete._conflicts.length > 0) {
            for (const conflictRevision of noteToDelete._conflicts) {
              try {
                await LOCAL_POUCH_CLIENT.remove(id, conflictRevision);
              }
              catch (error) {
                console.error(`Failed to delete conflict ${conflictRevision}:`, error);
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
        try {
          await LOCAL_POUCH_CLIENT.upsert(id, (noteToUpdate: any) => ({
            ...noteToUpdate,
            ...updates,
            updatedAt: new Date().toISOString(),
          }));

          // Get the fresh doc with new _rev.
          const updatedNote = await LOCAL_POUCH_CLIENT.get(id);

          // Map the id
          const updatedNoteForStateSync = {
            ...updatedNote,
            id: updatedNote._id
          };

          // Sync changes with state.
          get().upsertNoteInState(updatedNoteForStateSync);
        }
        catch (error) {
          console.error("Error updating note:", error);
        }
      },

      setCurrentNote: (newNote: Note | null) => {
        set({ currentNote: newNote });
      },

      setCurrentNoteUsingID: async (id: string) => {
        const note: Note = await LOCAL_POUCH_CLIENT.get(id);
        if (note)
          set({ currentNote: note });
      },

      clearCurrentNote: () => set({
        currentNote: null
      }),

      upsertNoteInState: (noteToUpsert: Note) => {
        const { notes, oramaIndex, currentNote } = get();
        const exists = notes.some(note => note.id === noteToUpsert.id);

        // Patch the Orama index: remove stale entry (if any) then re-insert
        if (oramaIndex) {
          if (exists) {
            // remove() targets the internal Orama document id, which we set
            // equal to the note id during insertMultiple — so this is safe.
            remove(oramaIndex, noteToUpsert.id);
          }
          insert(oramaIndex, {
            id: noteToUpsert.id,
            title: noteToUpsert.title,
            content: noteToUpsert.content,
            tags: noteToUpsert.tags,
            location: noteToUpsert.location,
          });
        }

        // Patch the notes array: replace or prepend
        const updatedNotes = exists
          ? notes.map(note => note.id === noteToUpsert.id ? noteToUpsert : note)
          : [noteToUpsert, ...notes];

        // Update state
        set({
          notes: updatedNotes,
          currentNote: currentNote?.id === noteToUpsert.id ? noteToUpsert : currentNote,
        });
      },

      removeNoteFromState: (id: string) => {
        const { oramaIndex, currentNote } = get();

        // Remove note from search index.
        if (oramaIndex)
          remove(oramaIndex, id);

        // Remove note from state.
        set((state) => ({
          notes: state.notes.filter(note => note.id !== id),
          currentNote: currentNote?.id === id ? null : currentNote,
        }));
      },
    }),
  )
);

export default useNotesStore;