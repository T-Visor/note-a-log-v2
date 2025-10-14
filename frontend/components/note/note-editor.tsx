"use client"

import { useEffect, useState, ChangeEvent } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import NoteTitleBar from "./note-title-bar";
import NoteContentArea from "./note-content-area";
import { Note } from "@/types/index";
import useNotesStore from "@/stores/useNotesStore";
import { motion } from "framer-motion";
import { useAutosave } from 'react-autosave';


const NoteEditor = () => {
  const {
    currentNote,
    setCurrentNote,
    addNote,
    updateNote
  } = useNotesStore();

  const [title, setTitle] = useState(currentNote?.title || "");
  const [content, setContent] = useState(currentNote?.content || "");
  const [tags, setTags] = useState(currentNote?.tags || []);
  const [isSaved, setIsSaved] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { open: sidebarOpen } = useSidebar();

  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [key, setKey] = useState(0);
  const forceRerender = () => {
    setKey(previousKey => previousKey + 1); // Incrementing the key forces a re-render
  };

  useEffect(() => {
    setTitle(currentNote?.title || "");
    setContent(currentNote?.content || "");
    setTags(currentNote?.tags || []);
    // Only trigger rerender/animation when we actually want to animate
    if (shouldAnimate) {
      forceRerender();
    }
    setShouldAnimate(true); // Set to true after the first load
  }, [currentNote?.id]);

  const handleTitleChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setTitle(event.target.value);
    setIsSaved(false);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    setContent(event.target.value);
    setIsSaved(false);
    setHasUnsavedChanges(true);
  };

  const setTagsThenSignalChange = (noteTags: string[]) => {
    setTags(noteTags);
    setIsSaved(false);
    setHasUnsavedChanges(true);
  }

  useAutosave({
    data: {
      title,
      content,
      tags,
      noteId: currentNote?.id ?? null
    },
    onSave: () => {
      if (!hasUnsavedChanges)
        return;
      handleSave();
      setHasUnsavedChanges(false);
    },
    interval: 800
  });

  const handleSave = () => {
    const isNewNote = !currentNote?.id;
    if (isNewNote) {
      const newNote: Note = {
        id: crypto.randomUUID(),
        title: title,
        content: content,
        tags: [],
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
        tags,
        updatedAt: new Date().toISOString()
      });
    }
    console.log("Saved: ", { title, content });
    setIsSaved(true);
  };

  return (
    <motion.div
      key={key}
      initial={{ opacity: 0, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`
        h-full w-full md:pb-3 mx-auto
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
        tags={tags}
        handleTitleChange={handleTitleChange}
        handleTagsChange={setTagsThenSignalChange}
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