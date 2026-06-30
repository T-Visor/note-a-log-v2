import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";
import { create as createOrama, insertMultiple, insert, remove } from "@orama/orama";
import { stemmer, language } from "@orama/stemmers/english";
import { pluginPT15 } from '@orama/plugin-pt15'
import { getNextReminderForNote, isToday, howManyDaysAgo, howManyDaysAhead, isOverdue } from "@/lib/date-time";

let LOCAL_POUCH_CLIENT: any = null;
let REMOTE_COUCHDB: any = null;
let SYNC_HANDLER_POUCHDB: any = null;
export const POUCHDB_LOCAL_DB_NAME_KEY = "pouchdb-local-db-name";

const POUCHDB_UPDATED_AT_SELECTOR = "updatedAt";
const POUCHDB_UPDATED_AT_INDEX_NAME = "updated-index";

export const TITLE_PREVIEW_CHARACTER_COUNT = 50;
export const CONTENT_PREVIEW_CHARACTER_COUNT = 50;
export interface SidebarNote {
  id: string;
  titlePreview: string;
  contentPreview: string;
  updatedAt: string; // ISO 8601
  reminderDate?: string;  // ISO 8601
  favorite?: boolean;
}
export interface OptimizedSidebarNotesState {
  mapIdToNote: Map<string, SidebarNote>;              // enables O(1) updates, O(logN) insertions/deletions
  generalSectionNoteIDs: string[];                    // to maintain a sorted set of references
  todaySectionNoteIDs: string[];
  upcomingSectionNoteIDs: string[],
  pastSectionNoteIDs: string[]
}

interface NotesStore {
  sidebarNotesState: OptimizedSidebarNotesState;
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
  const pouchDbFindMod = (await import("pouchdb-find")).default;
  PouchDB.plugin(upsertCouchDBMod);
  PouchDB.plugin(pouchDbFindMod);

  // Set-up the PouchDB client,
  // set-up the index to sort docs by modified date,
  // include handlers when removing or adding a note.
  const localDBNameForPouchClient = await getDBNameForLocalPouchClient();
  LOCAL_POUCH_CLIENT = new PouchDB(localDBNameForPouchClient);
  await LOCAL_POUCH_CLIENT.createIndex({
    index: {
      fields: [POUCHDB_UPDATED_AT_SELECTOR],
      name: POUCHDB_UPDATED_AT_INDEX_NAME
    }
  });

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

const insertSorted = (
  noteIDs: string[],
  mapIdToNote: Map<string, SidebarNote>,
  newId: string,
  dateKey: string,
  ascending: boolean
): string[] => {
  const targetTime = +new Date(dateKey);

  let low = 0
  let high = noteIDs.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    const midTime = +new Date(mapIdToNote.get(noteIDs[mid])!.reminderDate ?? mapIdToNote.get(noteIDs[mid])!.updatedAt);
    const goesAfter = ascending ? midTime < targetTime : midTime > targetTime;
    if (goesAfter) 
      low = mid + 1; 
    else 
      high = mid;
  }

  const result = noteIDs.slice();
  result.splice(low, 0, newId);
  return result;
};

function sortGeneralSection(ids: string[], mapIdToNote: Map<string, SidebarNote>): string[] {
  const favorites: string[] = [];
  const rest: string[] = [];

  for (const id of ids) {
    if (mapIdToNote.get(id)!.favorite) favorites.push(id);
    else rest.push(id);
  }

  const byUpdatedAtDesc = (a: string, b: string) =>
    +new Date(mapIdToNote.get(b)!.updatedAt) - +new Date(mapIdToNote.get(a)!.updatedAt);

  favorites.sort(byUpdatedAtDesc);
  rest.sort(byUpdatedAtDesc);

  return [...favorites, ...rest];
}

const useNotesStore = create<NotesStore>()(
  subscribeWithSelector(
    (set, get) => ({
      sidebarNotesState: {
        generalSectionNoteIDs: [],
        todaySectionNoteIDs: [],
        pastSectionNoteIDs: [],
        upcomingSectionNoteIDs: [],
        mapIdToNote: new Map()
      },
      currentNote: null,
      oramaIndex: null,

      loadNotes: async () => {
        // Instantiate PouchDB/CouchDB
        await initializePouchDBSync();
        if (!LOCAL_POUCH_CLIENT)
          return;

        // Get all docs sorted by last modified in descending order
        const response = await LOCAL_POUCH_CLIENT.find({
          selector: { [POUCHDB_UPDATED_AT_SELECTOR]: { $gt: null } },
          sort: [{ [POUCHDB_UPDATED_AT_SELECTOR]: "desc" }],
          conflicts: true,
          limit: Infinity
        });
        const docsFromPouchDB = response.docs

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
        const generalSectionNoteIDs: string[] = [];
        const todaySectionNoteIDs: string[] = [];
        const upcomingSectionNoteIDs: string[] = [];
        const pastSectionNoteIDs: string[] = [];
        const mapIdToNote: Map<string, SidebarNote> = new Map();

        // Create the Sidebar note and push to the collections.
        for (const note of docsFromPouchDB) {
          const sidebarNote: SidebarNote = {
            id: note._id,
            titlePreview: note.title?.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
            contentPreview: note.content?.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
            updatedAt: note.updatedAt,
            reminderDate: getNextReminderForNote(note.reminders || []),
            favorite: note.favorite || false
          }

          mapIdToNote.set(note._id, sidebarNote);
          const noteReminderDate = sidebarNote.reminderDate;

          /**
           * Seperate 'Today' notes from the rest of the collections, since
           * 'Today' is always on top of the sidebar. Naturally, there will be overlap
           * between 'General', 'Upcoming', and 'Past' sections.
           */
          if (noteReminderDate && isToday(noteReminderDate))
            todaySectionNoteIDs.push(note._id);
          else {
            generalSectionNoteIDs.push(note._id);
            if ((howManyDaysAhead(noteReminderDate!) ?? 0 >= 1) && !isOverdue(noteReminderDate!))
              upcomingSectionNoteIDs.push(note._id);
            if ((howManyDaysAgo(noteReminderDate!) ?? 0 >= 1) && isOverdue(noteReminderDate!))
              pastSectionNoteIDs.push(note._id);
          }

          // Sort ascending for Today and Upcoming sections.
          todaySectionNoteIDs.sort((first, second) => +new Date(mapIdToNote.get(first)!.reminderDate!) - +new Date(mapIdToNote.get(second)!.reminderDate!));
          upcomingSectionNoteIDs.sort((first, second) => +new Date(mapIdToNote.get(first)!.reminderDate!) - +new Date(mapIdToNote.get(second)!.reminderDate!));

          // Sort descending for Past section.
          pastSectionNoteIDs.sort((first, second) => +new Date(mapIdToNote.get(second)!.reminderDate!) - +new Date(mapIdToNote.get(first)!.reminderDate!));
        }

        const generalSectionFavoritesFirstNoteIDs = sortGeneralSection(generalSectionNoteIDs, mapIdToNote);

        set({
          sidebarNotesState: {
            generalSectionNoteIDs: generalSectionFavoritesFirstNoteIDs,
            todaySectionNoteIDs: todaySectionNoteIDs,
            upcomingSectionNoteIDs: upcomingSectionNoteIDs,
            pastSectionNoteIDs: pastSectionNoteIDs,
            mapIdToNote: mapIdToNote
          },
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
        const { sidebarNotesState, oramaIndex, currentNote } = get();
        const { 
          generalSectionNoteIDs, 
          mapIdToNote, 
          todaySectionNoteIDs, 
          upcomingSectionNoteIDs, 
          pastSectionNoteIDs 
        } = sidebarNotesState;

        const oldNote = mapIdToNote.get(noteToUpsert.id);
        const noteExists = !!oldNote;

        // Patch Orama index
        if (oramaIndex) {
          if (noteExists)
            remove(oramaIndex, noteToUpsert.id);
          insert(oramaIndex, {
            id: noteToUpsert.id,
            title: noteToUpsert.title,
            content: noteToUpsert.content,
            tags: noteToUpsert.tags,
            location: noteToUpsert.location,
          });
        }

        // Create the new SidebarNote representation
        const newSidebarNote: SidebarNote = {
          id: noteToUpsert.id,
          titlePreview: noteToUpsert.title?.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
          contentPreview: noteToUpsert.content?.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
          updatedAt: noteToUpsert.updatedAt,
          reminderDate: getNextReminderForNote(noteToUpsert.reminders || []),
          favorite: noteToUpsert.favorite || false
        };

        // Shallow copy the map and set the updated note
        const newMapIdToNote = new Map(mapIdToNote);
        newMapIdToNote.set(newSidebarNote.id, newSidebarNote);

        // Figure out section buckets (Old vs New)
        const oldNoteIsScheduledToday = oldNote?.reminderDate ? isToday(oldNote.reminderDate) : false;
        const oldNoteIsUpcoming = oldNote?.reminderDate ? (!isOverdue(oldNote.reminderDate) && (howManyDaysAhead(oldNote.reminderDate) ?? 0) >= 1) : false;
        const oldNoteIsOverDue = oldNote?.reminderDate ? (isOverdue(oldNote.reminderDate) && (howManyDaysAgo(oldNote.reminderDate) ?? 0) >= 1) : false;
        const oldNoteIsGeneral = noteExists && !oldNoteIsScheduledToday;

        const newNoteIsScheduledToday = newSidebarNote.reminderDate ? isToday(newSidebarNote.reminderDate) : false;
        const newNoteIsUpcoming = newSidebarNote.reminderDate ? (!isOverdue(newSidebarNote.reminderDate) && (howManyDaysAhead(newSidebarNote.reminderDate) ?? 0) >= 1) : false;
        const newNoteIsOverDue = newSidebarNote.reminderDate ? (isOverdue(newSidebarNote.reminderDate) && (howManyDaysAgo(newSidebarNote.reminderDate) ?? 0) >= 1) : false;
        const newNoteIsGeneral = !newNoteIsScheduledToday;

        // Filter out the note from sections it left or needs its position updated in
        let newToday = todaySectionNoteIDs;
        let newUpcoming = upcomingSectionNoteIDs;
        let newPast = pastSectionNoteIDs;
        let newGeneral = generalSectionNoteIDs;

        // Helper logic to clean old occurrences if it moved or needs a repositioning shift
        if (noteExists) {
          if (oldNoteIsScheduledToday || !newNoteIsScheduledToday) 
            newToday = newToday.filter(id => id !== noteToUpsert.id);
          if (oldNoteIsUpcoming || !newNoteIsUpcoming) 
            newUpcoming = newUpcoming.filter(id => id !== noteToUpsert.id);
          if (oldNoteIsOverDue || !newNoteIsOverDue) 
            newPast = newPast.filter(id => id !== noteToUpsert.id);
          if (oldNoteIsGeneral || !newNoteIsGeneral) 
            newGeneral = newGeneral.filter(id => id !== noteToUpsert.id);
        }

        // Surgically insert into appropriate sections with O(log N) positioning
        if (newNoteIsScheduledToday)
          newToday = insertSorted(newToday, newMapIdToNote, newSidebarNote.id, newSidebarNote.reminderDate!, true);
        else {
          // If it's not today, it's definitely in General
          // General section sorting: Favorites first, then sorting by updatedAt Descending.
          // Instead of using complex binary insertion for compound sorting rules, we simply insert it at the top and re-sort just the general array.
          // Since it's only array sorting (strings) rather than iterating through everything, it is highly efficient.
          newGeneral = [newSidebarNote.id, ...newGeneral];
          newGeneral = sortGeneralSection(newGeneral, newMapIdToNote);

          // Handle insert for upcoming and past
          if (newNoteIsUpcoming)
            newUpcoming = insertSorted(newUpcoming, newMapIdToNote, newSidebarNote.id, newSidebarNote.reminderDate!, true);
          else if (newNoteIsOverDue)
            newPast = insertSorted(newPast, newMapIdToNote, newSidebarNote.id, newSidebarNote.reminderDate!, false);
        }

        set({
          sidebarNotesState: {
            generalSectionNoteIDs: newGeneral,
            mapIdToNote: newMapIdToNote,
            todaySectionNoteIDs: newToday,
            upcomingSectionNoteIDs: newUpcoming,
            pastSectionNoteIDs: newPast,
          },
          currentNote: currentNote?.id === noteToUpsert.id ? noteToUpsert : currentNote,
        });
      },

      removeNoteFromState: (id: string) => {
        const { oramaIndex, currentNote, sidebarNotesState } = get();
        const { generalSectionNoteIDs, mapIdToNote, todaySectionNoteIDs, upcomingSectionNoteIDs, pastSectionNoteIDs } = sidebarNotesState;

        // Remove note from search index.
        if (oramaIndex)
          remove(oramaIndex, id);

        // Delete from sidebar notes state
        const newMapIdToNote = (mapIdToNote.delete(id), mapIdToNote);
        const newGeneralSectionIDs = generalSectionNoteIDs.filter(noteID => noteID !== id);
        const newTodaySectionIDs = todaySectionNoteIDs.filter(noteID => noteID !== id);
        const newUpcomingSectionIDs = upcomingSectionNoteIDs.filter(noteID => noteID !== id);
        const newPastSectionIDs = pastSectionNoteIDs.filter(noteID => noteID !== id);

        set({
          sidebarNotesState: {
            generalSectionNoteIDs: newGeneralSectionIDs,
            mapIdToNote: newMapIdToNote,
            todaySectionNoteIDs: newTodaySectionIDs,
            upcomingSectionNoteIDs: newUpcomingSectionIDs,
            pastSectionNoteIDs: newPastSectionIDs
          },
          currentNote: currentNote?.id === id ? null : currentNote,
        });
      },
    }),
  )
);

export default useNotesStore;