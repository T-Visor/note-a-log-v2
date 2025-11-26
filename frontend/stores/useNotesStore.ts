import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import localforage from "localforage";
import { Note } from "@/types/index";

interface NotesStore {
  // notes list operations
  notes: Note[];
  setNotes: (newNotes: Note[]) => void;
  clearAllNotes: () => void;
  addNote: (note: Note) => void;
  deleteNote: (id: string) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;

  // Current note operations
  currentNote: Note | null;
  setCurrentNote: (newNote: Note | null) => void;
  clearCurrentNote: () => void;
}

const localForageStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await localforage.getItem<string>(name)) ?? null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

const persistentStoreName = "notes-storage";
const broadcastChannelName = "notes-store-sync";

// Guard for SSR / Next.js
const broadcastChannel =
  typeof window !== "undefined"
    ? new BroadcastChannel(broadcastChannelName)
    : null;

const broadcastNotesUpdate = (notes: Note[]) => {
  if (!broadcastChannel) return;
  broadcastChannel.postMessage({
    type: "notes-updated",
    payload: notes,
  });
};

const useNotesStore = create<NotesStore>()(
  persist(
    (set, get) => ({
      notes: [],

      setNotes: (newNotes: Note[]) => {
        set({ notes: newNotes });
        broadcastNotesUpdate(newNotes);
      },

      clearAllNotes: () => {
        set({
          notes: [],
          currentNote: null,
        });
        broadcastNotesUpdate([]);
      },

      addNote: (newNote: Note) => {
        const nextNotes = [...get().notes, newNote];
        set({ notes: nextNotes });
        broadcastNotesUpdate(nextNotes);
      },

      deleteNote: (id: string) => {
        const nextNotes = get().notes.filter((note) => note.id !== id);
        const currentNote = get().currentNote;
        const nextCurrent =
          currentNote?.id === id ? null : currentNote ?? null;

        set({
          notes: nextNotes,
          currentNote: nextCurrent,
        });

        broadcastNotesUpdate(nextNotes);
      },

      updateNote: (id: string, updates: Partial<Note>) => {
        const nextNotes = get().notes.map((note) =>
          note.id === id ? { ...note, ...updates } : note
        );

        const currentNote = get().currentNote;
        const nextCurrent =
          currentNote?.id === id
            ? { ...currentNote, ...updates }
            : currentNote ?? null;

        set({
          notes: nextNotes,
          currentNote: nextCurrent,
        });

        broadcastNotesUpdate(nextNotes);
      },

      currentNote: null,

      setCurrentNote: (newNote: Note | null) => {
        set({ currentNote: newNote });
        // NOTE: we *don't* broadcast currentNote, only notes.
      },

      clearCurrentNote: () => set({ currentNote: null }),
    }),
    {
      name: persistentStoreName,
      storage: createJSONStorage(() => localForageStorage),
      // only persist the notes array, not UI state like currentNote
      partialize: (state) => ({ notes: state.notes }),
    }
  )
);

// Listen to updates from other tabs
if (broadcastChannel) {
  broadcastChannel.onmessage = (event: MessageEvent) => {
    if (!event?.data) return;

    const { type, payload } = event.data as {
      type: string;
      payload?: Note[];
    };

    if (type === "notes-updated" && Array.isArray(payload)) {
      // This will update subscribers in this tab
      useNotesStore.setState({ notes: payload });
    }
  };
}

export default useNotesStore;