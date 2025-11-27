// lib/noteUtils.ts
"use client";

import useNotesStore from "@/stores/useNotesStore";

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