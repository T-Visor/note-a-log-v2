import { create } from "zustand";
import { Note } from "@/types/index";

interface NotesStore {
  notes: Note[];
  setNotes: (newNotes: Note[]) => void;
  currentNote: Note | null;
  setCurrentNote: (newNote: Note) => void;
  clearCurrentNote: () => void;
}

const useNotesStore = create<NotesStore>((set) => ({
  // State for notes collection
  notes: [],
  setNotes: (newNotes: Note[]) => set({
    notes: newNotes
  }),

  // State for current note
  currentNote: null,
  setCurrentNote: (newNote: Note) => set({
    currentNote: newNote
  }),
  clearCurrentNote: () => set({
    currentNote: null
  })
}));

export default useNotesStore;