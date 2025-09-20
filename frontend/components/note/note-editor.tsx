"use client"

import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import NoteTitleBar from "./note-title-bar";
import NoteContentArea from "./note-content-area";
import { Note } from "@/types/index";
import useNotesStore from "@/stores/useNotesStore";
import { motion } from "framer-motion";

const NoteEditor = () => {
  const {
    currentNote,
    setCurrentNote,
    addNote,
    updateNote
  } = useNotesStore();

  const [title, setTitle] = useState(currentNote?.title || "");
  const [content, setContent] = useState(currentNote?.content || "");
  const [isSaved, setIsSaved] = useState(true);
  const { open: sidebarOpen } = useSidebar();

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [key, setKey] = useState(0);
  const forceRerender = () => {
    setKey(prevKey => prevKey + 1); // Incrementing the key forces a re-render
  };

  useEffect(() => {
    setTitle(currentNote?.title || "");
    setContent(currentNote?.content || "");
    // Only trigger rerender/animation when we actually want to animate
    if (shouldAnimate) {
      forceRerender();
    }
    setShouldAnimate(true); // Set to true after the first load
  }, [currentNote?.id]);

  const handleSave = () => {
    const isNewNote = !currentNote?.id;

    if (isNewNote) {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: title,
        content: content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setShouldAnimate(false); // Prevent animation for this save
      addNote(newNote);
      setCurrentNote(newNote);
    }
    else {
      updateNote(currentNote.id, {
        title,
        content,
        updatedAt: new Date().toISOString()
      });
    }
    console.log("Saved: ", { title, content });
    setIsSaved(true);
  };

  const handleTitleChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTitle(event.target.value);
    setIsSaved(false);
  };

  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setContent(event.target.value);
    setIsSaved(false);
  };

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`
        h-full w-full pb-3 mx-auto
        ${sidebarOpen 
          ? "md:max-w-[46rem] xl:max-w-[60rem]" 
          : "md:max-w-[51rem] xl:max-w-[70rem]"
        }
        transition-[max-width] duration-400 ease-in-out
        flex flex-col justify-start items-center
      `}
    >
      <NoteTitleBar
        title={title}
        content={content}
        handleTitleChange={handleTitleChange}
        handleSave={handleSave}
        isSaved={isSaved}
      />
      <NoteContentArea
        content={content}
        handleContentChange={handleContentChange}
      />
    </motion.div>
  );
};

export default NoteEditor;