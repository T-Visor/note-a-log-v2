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

  let low = 0, high = noteIDs.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    const midTime = +new Date(mapIdToNote.get(noteIDs[mid])!.reminderDate ?? mapIdToNote.get(noteIDs[mid])!.updatedAt);
    const goesAfter = ascending ? midTime < targetTime : midTime > targetTime;
    if (goesAfter) low = mid + 1; else high = mid;
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

      /*upsertNoteInState: (noteToUpsert: Note) => {
        const { sidebarNotesState, oramaIndex, currentNote } = get();
        const { generalSectionNoteIDs, mapIdToNote, todaySectionNoteIDs, upcomingSectionNoteIDs, pastSectionNoteIDs } = sidebarNotesState;
        const noteExists = mapIdToNote.has(noteToUpsert.id);

        // Patch the Orama index: remove stale entry (if any) then re-insert
        if (oramaIndex) {
          if (noteExists) {
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

        const sidebarNote: SidebarNote = {
          id: noteToUpsert.id,
          titlePreview: noteToUpsert.title?.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
          contentPreview: noteToUpsert.content?.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
          updatedAt: noteToUpsert.updatedAt,
          reminderDate: getNextReminderForNote(noteToUpsert.reminders || []),
          favorite: noteToUpsert.favorite || false
        }

        // Upserts the sidebar note into the Map.
        const newMapIdToNote = new Map(mapIdToNote);
        newMapIdToNote.set(sidebarNote.id, sidebarNote);

        // Rebuild all section arrays from scratch
        const newTodaySectionNoteIDs: string[] = [];
        const newUpcomingSectionNoteIDs: string[] = [];
        const newPastSectionNoteIDs: string[] = [];
        const newGeneralSectionNoteIDs: string[] = [];

        // Iterate over all notes in the map and categorize them
        newMapIdToNote.forEach((note) => {
          if (note.reminderDate && isToday(note.reminderDate))
            newTodaySectionNoteIDs.push(note.id);
          else {
            newGeneralSectionNoteIDs.push(note.id);
            if (note.reminderDate) {
              if (!isOverdue(note.reminderDate) && (howManyDaysAhead(note.reminderDate) ?? 0) >= 1)
                newUpcomingSectionNoteIDs.push(note.id);
              else if (isOverdue(note.reminderDate) && (howManyDaysAgo(note.reminderDate) ?? 0) >= 1) 
                newPastSectionNoteIDs.push(note.id);
            }
          }
        });

        // Sort Ascending
        newTodaySectionNoteIDs.sort((a, b) => +new Date(newMapIdToNote.get(a)!.reminderDate!) - +new Date(newMapIdToNote.get(b)!.reminderDate!));
        newUpcomingSectionNoteIDs.sort((a, b) => +new Date(newMapIdToNote.get(a)!.reminderDate!) - +new Date(newMapIdToNote.get(b)!.reminderDate!));

        // Sort Descending
        newPastSectionNoteIDs.sort((a, b) => +new Date(newMapIdToNote.get(b)!.reminderDate!) - +new Date(newMapIdToNote.get(a)!.reminderDate!));

        set({
          sidebarNotesState: {
            generalSectionNoteIDs: newGeneralSectionNoteIDs,
            mapIdToNote: newMapIdToNote,
            todaySectionNoteIDs: newTodaySectionNoteIDs,
            upcomingSectionNoteIDs: newUpcomingSectionNoteIDs,
            pastSectionNoteIDs: newPastSectionNoteIDs,
          },
          currentNote: currentNote?.id === noteToUpsert.id ? noteToUpsert : currentNote,
        });
      },*/

      // --- helper: binary-search insert into a date-sorted array of note IDs ---
      upsertNoteInState: (noteToUpsert: Note) => {
        const { sidebarNotesState, oramaIndex, currentNote } = get();
        const { generalSectionNoteIDs, mapIdToNote, todaySectionNoteIDs, upcomingSectionNoteIDs, pastSectionNoteIDs } = sidebarNotesState;
        const id = noteToUpsert.id;
        const noteExists = mapIdToNote.has(id);

        if (oramaIndex) {
          if (noteExists) remove(oramaIndex, id);
          insert(oramaIndex, {
            id,
            title: noteToUpsert.title,
            content: noteToUpsert.content,
            tags: noteToUpsert.tags,
            location: noteToUpsert.location,
          });
        }

        const sidebarNote: SidebarNote = {
          id,
          titlePreview: noteToUpsert.title?.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
          contentPreview: noteToUpsert.content?.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
          updatedAt: noteToUpsert.updatedAt,
          reminderDate: getNextReminderForNote(noteToUpsert.reminders || []),
          favorite: noteToUpsert.favorite || false,
        };

        const newMapIdToNote = new Map(mapIdToNote);
        newMapIdToNote.set(id, sidebarNote);

        const wasInToday = todaySectionNoteIDs.includes(id);
        const wasInGeneral = generalSectionNoteIDs.includes(id);
        const wasInUpcoming = upcomingSectionNoteIDs.includes(id);
        const wasInPast = pastSectionNoteIDs.includes(id);

        const reminderDate = sidebarNote.reminderDate;
        const isInToday = !!reminderDate && isToday(reminderDate);
        const isInGeneral = !isInToday;
        const isInUpcoming = !isInToday && !!reminderDate && !isOverdue(reminderDate) && (howManyDaysAhead(reminderDate) ?? 0) >= 1;
        const isInPast = !isInToday && !!reminderDate && isOverdue(reminderDate) && (howManyDaysAgo(reminderDate) ?? 0) >= 1;

        let newToday = todaySectionNoteIDs;
        let newGeneral = generalSectionNoteIDs;
        let newUpcoming = upcomingSectionNoteIDs;
        let newPast = pastSectionNoteIDs;

        // --- Today: only touch the array on category change, no resort on edit ---
        if (wasInToday !== isInToday) {
          newToday = wasInToday ? todaySectionNoteIDs.filter(n => n !== id) : todaySectionNoteIDs;
          if (isInToday) newToday = insertSorted(newToday, newMapIdToNote, id, reminderDate!, true);
        }

        // --- General: only touch the array on category change; insert by updatedAt (desc) on entry only ---
        // --- General: only touch the array on category change; insert into the correct partition ---
        if (wasInGeneral !== isInGeneral) {
          newGeneral = wasInGeneral ? generalSectionNoteIDs.filter(n => n !== id) : generalSectionNoteIDs;

          if (isInGeneral) {
            // 1. Separate current IDs into favorites and non-favorites
            const favorites: string[] = [];
            const nonFavorites: string[] = [];

            for (const noteId of newGeneral) {
              if (newMapIdToNote.get(noteId)?.favorite) {
                favorites.push(noteId);
              } else {
                nonFavorites.push(noteId);
              }
            }

            // 2. Insert into the appropriate partition using binary search
            if (sidebarNote.favorite) {
              const updatedFavorites = insertSorted(favorites, newMapIdToNote, id, sidebarNote.updatedAt, false);
              newGeneral = [...updatedFavorites, ...nonFavorites];
            } else {
              const updatedNonFavorites = insertSorted(nonFavorites, newMapIdToNote, id, sidebarNote.updatedAt, false);
              newGeneral = [...favorites, ...updatedNonFavorites];
            }
          }
        }
        // if wasInGeneral === isInGeneral, leave newGeneral untouched entirely — no reposition, no resort

        // --- Upcoming: only touch the array on category change ---
        if (wasInUpcoming !== isInUpcoming) {
          newUpcoming = wasInUpcoming ? upcomingSectionNoteIDs.filter(n => n !== id) : upcomingSectionNoteIDs;
          if (isInUpcoming) newUpcoming = insertSorted(newUpcoming, newMapIdToNote, id, reminderDate!, true);
        }

        // --- Past: only touch the array on category change ---
        if (wasInPast !== isInPast) {
          newPast = wasInPast ? pastSectionNoteIDs.filter(n => n !== id) : pastSectionNoteIDs;
          if (isInPast) newPast = insertSorted(newPast, newMapIdToNote, id, reminderDate!, false);
        }

        set({
          sidebarNotesState: {
            generalSectionNoteIDs: newGeneral,
            mapIdToNote: newMapIdToNote,
            todaySectionNoteIDs: newToday,
            upcomingSectionNoteIDs: newUpcoming,
            pastSectionNoteIDs: newPast,
          },
          currentNote: currentNote?.id === id ? noteToUpsert : currentNote,
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