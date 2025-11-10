import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware"
import localforage from "localforage";
import CryptoJS from "crypto-js";

const SECRET = "api-key-obfuscation-value";

interface APIKeyStore {
  apiKey: string;
  setApiKey: (key: string) => void;
}

const encryptedStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const item = await localforage.getItem<string>(name);
    if (!item) return null;

    try {
      const bytes = CryptoJS.AES.decrypt(item, SECRET);
      return bytes.toString(CryptoJS.enc.Utf8);
    }
    catch {
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    const encrypted = CryptoJS.AES.encrypt(value, SECRET).toString();
    await localforage.setItem(name, encrypted);
  },
  removeItem: async (name: string) => {
    await localforage.removeItem(name);
  }
}

const useAPIKeyStore = create<APIKeyStore>()(
  persist(
    (set) => ({
      apiKey: "",
      setApiKey: (apiKey) => set({ apiKey }),
    }),
    {
      name: "api-key-storage",
      storage: createJSONStorage(() => encryptedStorage),
    }
  )
);

export default useAPIKeyStore;