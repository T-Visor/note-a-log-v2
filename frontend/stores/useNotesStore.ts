import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"
import { Note } from "@/types/index";

interface NotesStore {
  notes: Note[];
  setNotes: (newNotes: Note[]) => void;
  clearAllNotes: () => void;
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;

  currentNote: Note | null;
  setCurrentNote: (newNote: Note) => void;
  clearCurrentNote: () => void;
}

const useNotesStore = create<NotesStore>()(
  persist((set) => ({
    notes: [],
    setNotes: (newNotes: Note[]) => set({
      notes: newNotes
    }),
    clearAllNotes: () => set({
      notes: [],
      currentNote: null
    }),
    addNote: (newNote: Note) => set((state) => ({
      notes: [...state.notes, newNote]
    })),
    deleteNote: (id: string) => set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
      currentNote: state.currentNote?.id === id ? null : state.currentNote
    })),
    updateNote: (
      id: string,
      updates: Partial<Note>
    ) => set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...updates } : note
      ),
      currentNote:
        state.currentNote?.id === id
          ? { ...state.currentNote, ...updates }
          : state.currentNote,
    })),
    currentNote: null,
    setCurrentNote: (newNote: Note) => set({
      currentNote: newNote
    }),
    clearCurrentNote: () => set({
      currentNote: null
    }),
  }),
    {
      name: "notes-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ notes: state.notes })
    },
  )
);

export default useNotesStore;