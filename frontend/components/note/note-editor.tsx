"use client"

import { useEffect, useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import NoteTitleBarWithSave from "./note-title-bar-with-save";
import NoteContentArea from "./note-content-area";
import { Note } from "@/types/index";
import useNotesStore from "@/stores/useNotesStore";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

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

  const [render, setRender] = useState(true);
  const [key, setKey] = useState(0);
  const forceRerender = () => {
    setKey(prevKey => prevKey + 1); // Incrementing the key forces a re-render
  };

  useEffect(() => {
    setTitle(currentNote?.title || "");
    setContent(currentNote?.content || "");
    forceRerender();
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
      setRender(false);
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
        transition={{ duration: 0.7 }}
        className={`
        h-full pb-3 ${sidebarOpen ? "w-[80%]" : "w-[70%]"}
        flex flex-col justify-start items-center 
        `
      }
      >
        <NoteTitleBarWithSave
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