import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware"
import localforage from "localforage";

export type ComputeLocation = "cloud" | "local";

interface AISettingsStore {
  computeLocation: ComputeLocation;
  setComputeLocation: (computeLocation: ComputeLocation) => void;
  useCustomAISettings: boolean;
  setUseCustomAISettings: (useCustomAISettings: boolean) => void;

  // Cloud
  selectedAIModel: string;
  setSelectedAIModel: (model: string) => void;

  // Local
  ollamaURL: string;
  setOllamaURL: (url: string) => void;
  ollamaAIModel: string;
  setOllamaAIModel: (model: string) => void;
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
      computeLocation: "cloud",
      setComputeLocation: (computeLocation) => set({ computeLocation }),
      useCustomAISettings: false,
      setUseCustomAISettings: (useCustomAISettings) => set({ useCustomAISettings }),

      // Cloud
      selectedAIModel: "",
      setSelectedAIModel: (selectedAIModel) => set({ selectedAIModel }),

      // Local
      ollamaURL: "",
      setOllamaURL: (ollamaURL) => set({ ollamaURL }),
      ollamaAIModel: "",
      setOllamaAIModel: (ollamaAIModel) => set({ ollamaAIModel }),  
    }),
    {
      name: "ai-configuration",
      storage: createJSONStorage(() => localForageStorage),
      partialize: (state) => ({ 
        // Exclude API key from being persisted since it is sensitive
        // and shouldn't be stored client-side.
        selectedAIModel: state.selectedAIModel,
        ollamaURL: state.ollamaURL,
        ollamaAIModel: state.ollamaAIModel,
        computeLocation: state.computeLocation,
        useCustomAISettings: state.useCustomAISettings
      }),
    }
  )
);

export default useAISettingsStore;