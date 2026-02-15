"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useNotesStore from "@/stores/useNotesStore";
import { useSearchParams, useRouter } from "next/navigation";

const NoteEditor = dynamic(() => import("@/components/note/note-editor"), {
  ssr: false,
});

const Home = () => {
  const searchParams = useSearchParams();
  const noteID = searchParams.get("id");
  const router = useRouter();
  const [hasLoadedInitialNotes, setHasLoadedInitialNotes] = useState(false);
  const { setCurrentNoteUsingID, loadNotes, currentNote } = useNotesStore();

  // We MUST await loadNotes before setting the flag to true
  useEffect(() => {
    const loadInitialNotes = async () => {
      await loadNotes(); 
      setHasLoadedInitialNotes(true);
    };
    loadInitialNotes();
  }, [loadNotes]);

  // 2. URL Listener
  useEffect(() => {
    // We only act if the notes are loaded AND there is an ID in the URL
    if (hasLoadedInitialNotes && noteID) {
      
      // Only update the store if the ID is actually different
      if (noteID !== currentNote?.id) {
        setCurrentNoteUsingID(noteID);
      }

      // Clean the URL so the ?id= doesn't stay forever
      router.replace("/", { scroll: false });
    }
  }, [noteID, hasLoadedInitialNotes, currentNote, setCurrentNoteUsingID, router]);

  return <NoteEditor />;
};

export default Home;