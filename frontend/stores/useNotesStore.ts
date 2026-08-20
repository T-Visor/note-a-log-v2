import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";
import { create as createOrama, insertMultiple, insert, remove } from "@orama/orama";
import { stemmer, language } from "@orama/stemmers/english";
import { pluginPT15 } from '@orama/plugin-pt15'
import { getNextReminderForNote, isToday, howManyDaysAgo, howManyDaysAhead, isOverdue } from "@/lib/date-time";
import { dateMatchesRecurrenceRule, getTodayOccurenceDateTime } from "@/lib/recurrence-rules-date-time";

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
  const cached = localStorage.getItem(POUCHDB_LOCAL_DB_NAME_KEY);

  if (navigator.onLine) {
    try {
      const response = await fetch("/api/couchdb/meta", { credentials: "include" });

      // Handle explicitly expired session
      if (response.status === 401 || response.status === 403) {
        // Clear old cached DB name so next login gets a clean slate
        localStorage.removeItem(POUCHDB_LOCAL_DB_NAME_KEY);
        throw new Error("Session expired. Please log in again.");
      }

      if (!response.ok) {
        throw new Error("Server error fetching DB metadata");
      }

      const { dbName } = await response.json();

      // Update cache if changed
      if (cached !== dbName) {
        localStorage.setItem(POUCHDB_LOCAL_DB_NAME_KEY, dbName);
      }

      return dbName as string;
    } 
    catch (error) {
      // If session was explicitly unauthorized, don't fall back, bubble the authentication error up
      if ((error as Error).message.includes("Session expired")) {
        throw error;
      }

      // If it was just a network/server glitch while fetching, gracefully fall back to cache
      console.warn("Online fetch failed, falling back to cached DB name:", error);
      if (cached) 
        return cached;
    }
  }

  // User is offline OR online fetch failed with network error
  if (cached)
    return cached;

  // If all paths fail, throw an exception
  throw new Error("No offline database cached and unable to reach server.");
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
  LOCAL_POUCH_CLIENT = new PouchDB(localDBNameForPouchClient, { auto_compaction: true });
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

const sortGeneralSection = (
  noteIDs: string[], 
  mapIdToNote: Map<string, SidebarNote>
): string[] => {
  const favorites: string[] = [];
  const rest: string[] = [];

  for (const noteID of noteIDs) {
    if (mapIdToNote.get(noteID)!.favorite) 
      favorites.push(noteID);
    else 
      rest.push(noteID);
  }

  const byUpdatedAtDescending = (first: string, second: string) =>
    +new Date(mapIdToNote.get(second)!.updatedAt) - +new Date(mapIdToNote.get(first)!.updatedAt);

  favorites.sort(byUpdatedAtDescending);
  rest.sort(byUpdatedAtDescending);

  return [...favorites, ...rest];
};

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
            tokenizer: { 
              stemming: false, 
              language, 
              stemmer 
            }
          }
        });

        // Insert the searchable portion of the notes data into the search index.
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

        // Store today's date once, this will be used for checking against notes
        // containing a recurrence rule.
        const todayISO8601 = new Date().toISOString();

        // Create the Sidebar note and push to the collections.
        for (const note of docsFromPouchDB) {
          const sidebarNote: SidebarNote = {
            id: note._id,
            titlePreview: note.title?.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
            contentPreview: note.content?.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
            updatedAt: note.updatedAt,
            reminderDate: getNextReminderForNote(note.reminders || []),
            favorite: note.favorite || false
          };

          mapIdToNote.set(note._id, sidebarNote);
          const noteReminderDate = sidebarNote.reminderDate;

          /**
           * Seperate 'Today' notes from the rest of the collections, since
           * 'Today' is always on top of the sidebar. Naturally, there will be overlap
           * between 'General', 'Upcoming', and 'Past' sections.
           */
          if (noteReminderDate && isToday(noteReminderDate))
            todaySectionNoteIDs.push(note._id);
          else if (note.recurrence?.recurrenceRule) {
            console.log("FOUND RECURRENCE RULE")
            // This is the case where a note has a recurrence rule (rrule).
            // Here we check if today's date is an occurrence, and if the skipDate override is NOT today, we add it to the Today section.
            if (dateMatchesRecurrenceRule(todayISO8601, note.recurrence.recurrenceRule) && !isToday(note.recurrence.skipDate)) {
              todaySectionNoteIDs.push(note._id);

              // Update the sidebar note's reminderDate to today's occurence date-time
              const occurenceDateTime = getTodayOccurenceDateTime(note.recurrence.recurrenceRule, todayISO8601);
              if (occurenceDateTime) {
                const sidebarNote = mapIdToNote.get(note._id);
                if (sidebarNote) {
                  sidebarNote.reminderDate = occurenceDateTime.toISOString();
                }
              }
            }
            // IMPORTANT: Always add recurrence notes to General section
            // (they're not "scheduled" in the traditional sense, but they should still appear)
            else {
              generalSectionNoteIDs.push(note._id);
            }
          }
          else {
            generalSectionNoteIDs.push(note._id);
            if ((howManyDaysAhead(noteReminderDate!) ?? 0 >= 1) && !isOverdue(noteReminderDate!))
              upcomingSectionNoteIDs.push(note._id);
            if ((howManyDaysAgo(noteReminderDate!) ?? 0 >= 1) && isOverdue(noteReminderDate!))
              pastSectionNoteIDs.push(note._id);
          }

          // Sort ascending for Today and Upcoming sections. 
          // The Today section sorting should also handle recurrence rule notes, since we store today's occurence date/time.
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

        /* Surgically add the newly modified note into its appropriate position for each section */
        if (newNoteIsScheduledToday) {
          // O(log N) insertion
          newToday = insertSorted(
            newToday, 
            newMapIdToNote, 
            newSidebarNote.id, 
            newSidebarNote.reminderDate!, 
            true
          );
        } 
        else {
          // Surgical O(1) insertion into General Section depending on favorite status
          const nextGeneral = newGeneral.filter(id => id !== newSidebarNote.id);

          if (newSidebarNote.favorite) {
            // Favorite notes sit at index 0 (most recently modified favorite)
            newGeneral = [newSidebarNote.id, ...nextGeneral];
          } 
          else {
            // Unfavorited notes sit directly after the last favorite note
            const firstNonFavoriteIndex = nextGeneral.findIndex(id => !newMapIdToNote.get(id)?.favorite);
            const insertIndex = firstNonFavoriteIndex === -1 
              ? nextGeneral.length 
              : firstNonFavoriteIndex;

            nextGeneral.splice(insertIndex, 0, newSidebarNote.id);
            newGeneral = nextGeneral;
          }

          if (newNoteIsUpcoming) {
            newUpcoming = insertSorted(
              newUpcoming, 
              newMapIdToNote, 
              newSidebarNote.id, 
              newSidebarNote.reminderDate!, 
              true
            );
          } 
          else if (newNoteIsOverDue) {
            newPast = insertSorted(
              newPast, 
              newMapIdToNote, 
              newSidebarNote.id, 
              newSidebarNote.reminderDate!, 
              false
            );
          }
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

        // Remove note from search index
        if (oramaIndex)
          remove(oramaIndex, id);

        // Create a shallow copy before deleting to respect immutability
        const newMapIdToNote = new Map(mapIdToNote);
        newMapIdToNote.delete(id);

        // Filter out the deleted note
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