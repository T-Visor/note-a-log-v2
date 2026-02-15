"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import useNotesStore from "@/stores/useNotesStore";
import { useSearchParams } from "next/navigation";

const NoteEditor = dynamic(() => import("@/components/note/note-editor"), {
  ssr: false,
});

const Home = () => {
  const { setCurrentNoteUsingID, loadNotes } = useNotesStore();

  // Load all notes once on component mount, always do this
  // before attempting to set a note, seen in the code below.
  useEffect(() => {
    loadNotes();
  }, []);

  // if the id was supplied in the URL, try to set the current note using the ID
  const searchParams = useSearchParams();
  const noteID = searchParams.get("id");
  if (noteID)
    setCurrentNoteUsingID(noteID);

  return <NoteEditor />;
};

export default Home;