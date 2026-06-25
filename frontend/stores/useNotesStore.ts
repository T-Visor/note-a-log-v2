import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";
import { create as createOrama, insertMultiple, insert, remove } from "@orama/orama";
import { stemmer, language } from "@orama/stemmers/english";
import { pluginPT15 } from '@orama/plugin-pt15'
import { getNextReminderForNote } from "@/lib/date-time";

let LOCAL_POUCH_CLIENT: any = null;
let REMOTE_COUCHDB: any = null;
let SYNC_HANDLER_POUCHDB: any = null;
export const POUCHDB_LOCAL_DB_NAME_KEY = "pouchdb-local-db-name";

const TITLE_PREVIEW_CHARACTER_COUNT = 50;
const CONTENT_PREVIEW_CHARACTER_COUNT = 50;
export interface SidebarNote {
  id: string;
  titlePreview: string;
  contentPreview: string;
  updatedAt: string; // ISO 8601
  reminderDate?: string;  // ISO 8601
  favorite?: boolean;
}
export interface OptimizedSidebarNotesState {
  noteIDs: string[];                    // to maintain a sorted set of references
  notesByID: Map<string, SidebarNote>;  // enables O(1) updates, O(logN) insertions/deletions
}

interface NotesStore {
  sidebarNotesState: OptimizedSidebarNotesState;
  sidebarNotes: SidebarNote[];
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
      sidebarNotes: [],
      sidebarNotesState: {
        noteIDs: [],
        notesByID: new Map()
      },
      currentNote: null,
      oramaIndex: null,

      loadNotes: async () => {
        // Instantiate PouchDB/CouchDB
        await initializePouchDBSync();
        if (!LOCAL_POUCH_CLIENT)
          return;

        // Extract the docs from PouchDB containing the notes data.
        const response = await LOCAL_POUCH_CLIENT.allDocs({ include_docs: true, conflicts: true });
        const docsFromPouchDB = response.rows
          .filter((row: any) => !row.id.startsWith("_")) // Remove system docs
          .map((row: any) => row.doc);

        // Create the search index for notes.
        const index = createOrama({
          schema: {
            title: "string",
            content: "string",
            tags: "string[]",
            location: "string"
          },
          plugins: [pluginPT15()],
          components: {
            tokenizer: { stemming: false, language, stemmer }
          }
        });

        // Insert the searchable portion of the notes data into the index.
        const searchableNotes = docsFromPouchDB.map((currentNote: any) => ({
          id: currentNote._id,
          title: currentNote.title || "",
          content: currentNote.content || "",
          tags: currentNote.tags || [],
          location: currentNote.location
        }));
        insertMultiple(index, searchableNotes);

        // temp data structures which will be used for the optimized sidebar notes state.
        const noteIDs: string[] = [];
        const notesByID: Map<string, SidebarNote> = new Map();

        // Create the Sidebar note and push to the collections
        for (const note of docsFromPouchDB) {
          const sidebarNote: SidebarNote = {
            id: note._id,
            titlePreview: note.title?.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
            contentPreview: note.content?.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
            updatedAt: note.updatedAt,
            reminderDate: getNextReminderForNote(note.reminders || []),
            favorite: note.favorite || false
          }

          noteIDs.push(note._id);
          notesByID.set(note._id, sidebarNote);
        }

        // Sort the Note IDs collection based on when the note was last updated, descending order.
        noteIDs.sort((first, second) => {
          const firstDate = notesByID.get(first)!.updatedAt;
          const secondDate = notesByID.get(second)!.updatedAt;
          return +new Date(secondDate) - +new Date(firstDate);
        });

        set({
          sidebarNotesState: { noteIDs, notesByID },
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
        await initializePouchDBSync();
        if (!LOCAL_POUCH_CLIENT)
          return;
        const note: Note = await LOCAL_POUCH_CLIENT.get(id);
        set({ currentNote: note });
      },

      clearCurrentNote: () => set({
        currentNote: null
      }),

      upsertNoteInState: (noteToUpsert: Note) => {
        const { sidebarNotes, oramaIndex, currentNote } = get();
        const exists = sidebarNotes.some(note => note.id === noteToUpsert.id);

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

        const sidebarNoteToUpsert: SidebarNote = {
          id: noteToUpsert.id,
          titlePreview: noteToUpsert.title?.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
          contentPreview: noteToUpsert.content?.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
          updatedAt: noteToUpsert.updatedAt,
          reminderDate: getNextReminderForNote(noteToUpsert.reminders || []),
          favorite: noteToUpsert.favorite || false
        }

        // Patch the sidebar notes array: replace or prepend
        const updatedNotes = exists
          ? sidebarNotes.map(sidebarNote => sidebarNote.id === sidebarNoteToUpsert.id ? sidebarNoteToUpsert : sidebarNote)
          : [sidebarNoteToUpsert, ...sidebarNotes];

        // Update state
        set({
          sidebarNotes: updatedNotes,
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
          sidebarNotes: state.sidebarNotes.filter(note => note.id !== id),
          currentNote: currentNote?.id === id ? null : currentNote,
        }));
      },
    }),
  )
);

export default useNotesStore;