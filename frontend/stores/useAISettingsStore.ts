import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware"
import localforage from "localforage";
import CryptoJS from "crypto-js";

const OBFUSCATION_VALUE_SECRET = "Alkalize-Apron-Slapstick-Puritan443$$21";

interface AISettingsStore {
  apiKey: string;
  setApiKey: (key: string) => void;
  selectedAIModel: string;
  setSelectedAIModel: (model: string) => void;
}

const encryptedStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const item = await localforage.getItem<string>(name);
    if (!item) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(item, OBFUSCATION_VALUE_SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    }
    catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    const encrypted = CryptoJS.AES.encrypt(value, OBFUSCATION_VALUE_SECRET).toString();
    await localforage.setItem(name, encrypted);
  },
  removeItem: async (name: string) => {
    await localforage.removeItem(name);
  }
}

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
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
);

export default useAISettingsStore;