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
  if (typeof window === "undefined") return;
  if (pouchDBClient) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const PouchDB = (await import("pouchdb-browser")).default;
    //const cryptoPouchMod = await import("crypto-pouch");
    const upsertPouchMod = await import("pouchdb-upsert");

    // Register plugins
    /*const cryptoPouch = (cryptoPouchMod as any).default ?? (cryptoPouchMod as any);
    if (typeof PouchDB.plugin === "function") {
      PouchDB.plugin(cryptoPouch);
    } else if (typeof cryptoPouch === "function") {
      cryptoPouch(PouchDB);
    }*/
    PouchDB.plugin(upsertPouchMod);

    // Create databases
    const localDbName = await getLocalDbName();
    const localPouchDbKey = await getLocalPouchDbKey();
    pouchDBClient = new PouchDB<Note>(localDbName);

    // Encrypt local PouchDB
    //await pouchDBClient.crypto(localPouchDbKey);

    remoteCouchDB = new PouchDB(`${BASE_URL_FOR_COUCHDB_PROXY}/api/couchdb`);

    console.log("✅ PouchDB initialized:", {
      local: pouchDBClient.name,
      remote: remoteCouchDB.name
    });

    // Test remote connection
    try {
      const remoteInfo = await remoteCouchDB.info();
      console.log("✅ Remote CouchDB connected:", remoteInfo);
    } 
    catch (error) {
      console.error("❌ Failed to connect to remote:", error);
    }

    // Set up local change listener
    pouchDBClient
      .changes({ since: "now", live: true, include_docs: true })
      .on("change", (change: any) => {
        console.log("Local change detected:", change.id);
        useNotesStore.getState().loadNotes();
      });

    // FIXED: Use instance method, not static method
    syncHandler = pouchDBClient.sync(remoteCouchDB, {
      live: true,
      retry: true,
    })
      .on("change", (info: any) => {
        console.log(`Sync ${info.direction}:`, {
          docs_read: info.change.docs_read,
          docs_written: info.change.docs_written,
        });
      })
      .on("paused", (error: any) => {
        if (error) {
          console.warn("Sync paused with error:", error);
        } else {
          console.log("Sync paused (caught up)");
        }
      })
      .on("active", () => {
        console.log("Sync active");
      })
      .on("error", (error: any) => {
        console.error("Sync error:", error);
      })
      .on("denied", (error: any) => {
        console.error("Sync denied:", error);
      });

    console.log("✅ Sync initialized");
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

        const response = await pouchDBClient.allDocs({ include_docs: true, conflicts: true });
        const notesList = response.rows.flatMap(
          (row: any) => row.doc ? [row.doc] : []
        );

        set({ notes: notesList });
      },

      addNote: async (newNote: Note) => {
        await initializePouchDB();
        if (!pouchDBClient) return;

        /*await pouchDBClient.put({
          _id: newNote.id,
          ...newNote
        });*/

        await pouchDBClient.upsert(newNote.id, (noteToAdd: any) => {
          if (noteToAdd?._id) {
            // Already exists - this shouldn't happen in normal flow
            console.warn('Note already exists:', newNote.id);
            return noteToAdd;
          }
          return {
            ...newNote,
          };
        });
      },

      deleteNote: async (id: string) => {
        // Immediately remove from UI (optimistic update)
        set({
          notes: get().notes.filter(note => note.id !== id),
          currentNote: get().currentNote?.id === id ? null : get().currentNote
        });

        await initializePouchDB();
        if (!pouchDBClient) return;

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
        console.table(updates);

        await initializePouchDB();
        if (!pouchDBClient) {
          console.error('pouchDBClient is null after init');
          return;
        }

        try {
          // Check current doc before update
          const beforeDoc = await pouchDBClient.get(id);
          console.log('📄 Doc BEFORE update:', {
            _id: beforeDoc._id,
            _rev: beforeDoc._rev,
            title: beforeDoc.title,
            content: beforeDoc.content?.substring(0, 50)
          });

          const result = await pouchDBClient.upsert(id, (doc: any) => {
            console.log('📝 Inside upsert callback:', {
              doc_rev: doc._rev,
              doc_id: doc._id
            });

            const updated = {
              ...doc,
              ...updates,
              updatedAt: new Date().toISOString(),
            };

            console.log('📤 Returning from upsert:', {
              _rev: updated._rev,
              updatedAt: updated.updatedAt
            });

            return updated;
          });

          console.log('✅ Upsert completed:', result);

          // Check doc after update
          const afterDoc = await pouchDBClient.get(id);
          console.log('📄 Doc AFTER update:', {
            _id: afterDoc._id,
            _rev: afterDoc._rev,
            title: afterDoc.title,
            content: afterDoc.content?.substring(0, 50)
          });

          // Wait a moment and check if it reached remote
          setTimeout(async () => {
            try {
              const remoteDoc = await remoteCouchDB.get(id);
              console.log('☁️ Doc on REMOTE:', {
                _rev: remoteDoc._rev,
                title: remoteDoc.title,
                matches_local: remoteDoc._rev === afterDoc._rev
              });
            } catch (err) {
              console.error('Could not fetch from remote:', err);
            }
          }, 2000);

          console.log('=== UPDATE NOTE END ===');
        } 
        catch (error) {
          console.error("Error updating note:", error);
        }
      },

      setCurrentNote: (newNote: Note | null) => {
        set({ currentNote: newNote });
      },

      clearCurrentNote: () => set({ currentNote: null }),
    }),
  )
);

export default useNotesStore;