"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useNotesStore from "@/stores/useNotesStore";
import { useSearchParams } from "next/navigation";

const NoteEditor = dynamic(() => import("@/components/note/single-note/note-editor"), {
  ssr: false,
});

const HomeContent = () => {
  const { loadSingleNote, currentNote } = useNotesStore();
  const searchParams = useSearchParams();
  const noteID = searchParams.get("id");
  const [isInitializing, setIsInitializing] = useState(true); 

  // Fetch note by ID asynchronously
  useEffect(() => {
    const initializeWithSingleNote = async () => {
      if (noteID) {
        setIsInitializing(true);
        await loadSingleNote(noteID);
      }
      setIsInitializing(false); // Mark as done once the await finishes (or if there's no noteID)
    };
    initializeWithSingleNote();
  }, [noteID, loadSingleNote]);

  // Block the NoteEditor from rendering until we are done fetching
  if (isInitializing) {
    return (
      <div className="flex justify-center items-center">
        Fetching note...
      </div>
    );
  }
  else {
    return <NoteEditor />;
  }
  // If you require a note to exist before showing the editor at all:
  // if (noteID && !currentNote) return <div>Note not found.</div>;
};

export default HomeContent;