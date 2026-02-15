"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import useNotesStore from "@/stores/useNotesStore";
import { useSearchParams, useRouter } from "next/navigation";

const NoteEditor = dynamic(() => import("@/components/note/note-editor"), {
  ssr: false,
});

const HomeContent = () => {
  const searchParams = useSearchParams();
  const noteID = searchParams.get("id");
  const router = useRouter();
  const [hasLoadedInitialNotes, setHasLoadedInitialNotes] = useState(false);

  // Use selectors for stable references to avoid the loops.
  const loadNotes = useNotesStore((state) => state.loadNotes);
  const setCurrentNoteUsingID = useNotesStore((state) => state.setCurrentNoteUsingID);

  // Load notes once.
  useEffect(() => {
    loadNotes().then(() => setHasLoadedInitialNotes(true));
  }, [loadNotes]);

  // If a note ID was supplied via query parameter, set the current note 
  // based on the supplied note ID.
  useEffect(() => {
    if (hasLoadedInitialNotes && noteID) {
      setCurrentNoteUsingID(noteID);
      router.replace("/", { scroll: false });
    }
  }, [noteID, hasLoadedInitialNotes, setCurrentNoteUsingID, router]);

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