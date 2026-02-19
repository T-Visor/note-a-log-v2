"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import useNotesStore from "@/stores/useNotesStore";

const NoteEditor = dynamic(() => import("@/components/note/single-note/note-editor"), {
  ssr: false,
});

const HomeContent = () => {
  const { loadSingleNote } = useNotesStore();
  const searchParams = useSearchParams();
  const noteID = searchParams.get("id");

  // Start initializing ONLY if we actually have an ID to fetch
  const [isInitializing, setIsInitializing] = useState(!!noteID); 

  useEffect(() => {
    const initializeWithSingleNote = async () => {
      if (noteID) {
        setIsInitializing(true);
        try {
          await loadSingleNote(noteID);
        } 
        catch (error) {
          console.error("Failed to load note:", error);
        }
      }
      setIsInitializing(false); 
    };
    initializeWithSingleNote();
  }, [noteID, loadSingleNote]);

  if (isInitializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p className="animate-pulse">Fetching note...</p>
      </div>
    );
  }

  return <NoteEditor />;
};

export default function Home() {
  return (
    // This Suspense boundary catches useSearchParams() 
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center">
        Loading...
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}