import { create } from "zustand";
import { Note } from "@/types/index";

interface NotesStore {
  notes: Note[];
  setNotes: (newNotes: Note[]) => void;
  clearAllNotes: () => void;

  currentNote: Note | null;
  setCurrentNote: (newNote: Note) => void;
  clearCurrentNote: () => void;

  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  //updateNote: (id: string, updates: Partial<Note>) => void;
}

const useNotesStore = create<NotesStore>((set) => ({
  notes: [],
  setNotes: (newNotes: Note[]) => set({
    notes: newNotes
  }),
  clearAllNotes: () => set({
    notes: []
  }),

  currentNote: null,
  setCurrentNote: (newNote: Note) => set({
    currentNote: newNote
  }),
  clearCurrentNote: () => set({
    currentNote: null
  }),

  addNote: (newNote: Note) => set((state) => ({
    notes: [...state.notes, newNote]
  })),
  deleteNote: (id: string) => set((state) => ({
    notes: state.notes.filter((note) => note.id !== id), 
    // handles case where current note is selected for deletion
    currentNote: state.currentNote?.id === id ? null : state.currentNote
  }))
}));

export default useNotesStore;