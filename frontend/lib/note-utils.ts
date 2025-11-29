// lib/noteUtils.ts
"use client";

import useNotesStore from "@/stores/useNotesStore";
import { Note } from "@/types";

export const exportNotesSnapshot = () => {
  const { notes } = useNotesStore.getState();

  const snapshot = {
    exportDate: new Date().toISOString(),
    notesCount: notes.length,
    notes: notes
  };
  
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `notes-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url); // cleanup
};

export const importNotesSnapshot = (file: File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate the data structure
        if (!data.notes || !Array.isArray(data.notes)) {
          throw new Error('Invalid notes backup file');
        }
        
        // Import the notes
        useNotesStore.getState().setNotes(data.notes as Note[]);
        resolve();
      } 
      catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
};