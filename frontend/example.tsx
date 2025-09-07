"use client"

import { useEffect } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import NoteTitleBarWithSave from "./note-title-bar-with-save";
import NoteContentArea from "./note-content-area";
import useNotesStore from "@/stores/useNotesStore";

const NoteEditor = () => {
  const { 
    currentNote, 
    addNote, 
    updateNote, // You'll need to add this to your store
    loading 
  } = useNotesStore();
  
  const { open: sidebarOpen } = useSidebar();

  // Derive state from currentNote
  const title = currentNote?.title || "";
  const content = currentNote?.content || "";
  const isNewNote = !currentNote?.id;
  
  // Track if content has changed (simple approach)
  const originalTitle = currentNote?.title || "";
  const originalContent = currentNote?.content || "";
  const hasChanges = title !== originalTitle || content !== originalContent;

  const handleSave = async () => {
    if (isNewNote) {
      // Create new note
      const newNote = {
        id: crypto.randomUUID(), // or your ID generation logic
        title: title || "Untitled",
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await addNote(newNote);
    } else {
      // Update existing note
      await updateNote(currentNote.id, {
        title: title || "Untitled",
        content,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Update the current note in store with new title
    if (currentNote) {
      useNotesStore.setState({
        currentNote: { ...currentNote, title: event.target.value }
      });
    }
  };

  const handleContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Update the current note in store with new content
    if (currentNote) {
      useNotesStore.setState({
        currentNote: { ...currentNote, content: event.target.value }
      });
    }
  };

  // Show empty state if no note is selected
  if (!currentNote) {
    return (
      <div className={`h-full ${sidebarOpen ? "w-[80%]" : "w-[70%]"} flex items-center justify-center`}>
        <p className="text-muted-foreground">Select a note to start editing</p>
      </div>
    );
  }

  return (
    <div
      className={`
        h-full ${sidebarOpen ? "w-[80%]" : "w-[70%]"}
        flex flex-col justify-center items-center 
        transition-all duration-300 ease-in-out
      `}
    >
      <NoteTitleBarWithSave
        title={title}
        content={content}
        handleTitleChange={handleTitleChange}
        handleSave={handleSave}
        isSaved={!hasChanges && !loading}
      />
      <NoteContentArea
        content={content}
        handleContentChange={handleContentChange}
      />
    </div>
  );
};

export default NoteEditor;
