import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"
import localforage from "localforage";

interface APIKeyStore {
  apiKey: string;
  setApiKey: (key: string) => void;
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

const useAPIKeyStore = create<APIKeyStore>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    {
      name: "api-key-storage",
      storage: createJSONStorage(() => localForageStorage),
    }
  )
);

export default useAPIKeyStore;