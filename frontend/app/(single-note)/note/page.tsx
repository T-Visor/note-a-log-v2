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
  const { loadSingleNote } = useNotesStore();
  const searchParams = useSearchParams();
  const noteID = searchParams.get("id");

  // Watch for note ID changes and update current note
  useEffect(() => {
    if (noteID)
      loadSingleNote(noteID);
  }, []);

  return <NoteEditor />;
};

const Home = () => {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center">
          Loading notes...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
};

export default Home;