import { create } from "zustand";
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

const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  setNotes: (newNotes: Note[]) => set({
    notes: newNotes
  }),
  clearAllNotes: () => set({
    notes: []
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
}));

export default useNotesStore;