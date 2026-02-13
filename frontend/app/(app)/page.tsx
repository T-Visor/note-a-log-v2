"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import useNotesStore from "@/stores/useNotesStore";

const NoteEditor = dynamic(() => import("@/components/note/note-editor"), {
  ssr: false,
});

const Home = () => {
  useEffect(() => {
    useNotesStore.getState().loadNotes();
  }, []);

  return <NoteEditor />;
};

export default Home;