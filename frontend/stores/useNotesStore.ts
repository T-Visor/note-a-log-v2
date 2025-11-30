import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Note } from "@/types/index";
import PouchDB from "pouchdb-browser";

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
        await get().loadNotes();
      },

      deleteNote: async (id: string) => {
        const noteToDelete = await pouchDBClient.get(id);
        await pouchDBClient.remove(noteToDelete);
        await get().loadNotes();

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
        await get().loadNotes();

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