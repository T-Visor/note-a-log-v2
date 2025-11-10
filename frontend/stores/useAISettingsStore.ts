import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware"
import localforage from "localforage";

interface AISettingsStore {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedAIModel: string;
  setSelectedAIModel: (model: string) => void;
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

const useAISettingsStore = create<AISettingsStore>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey) => set({ apiKey }),
      selectedAIModel: "",
      setSelectedAIModel: (selectedAIModel) => set({ selectedAIModel })
    }),
    {
      name: "api-key-storage",
      storage: createJSONStorage(() => localForageStorage),
      partialize: (state) => ({ selectedAIModel: state.selectedAIModel }),
    }
  )
);

export default useAISettingsStore;