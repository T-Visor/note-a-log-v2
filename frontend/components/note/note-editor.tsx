"use client"

import { useEffect, useState, ChangeEvent, useRef, KeyboardEvent } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import NoteTitleBar from "./note-title-bar";
import NoteContentArea from "./note-content-area";
import { Note } from "@/types/index";
import useNotesStore from "@/stores/useNotesStore";
import { motion } from "framer-motion";
import { useAutosave } from "react-autosave";
import { Block } from "@blocknote/core";

const NoteEditor = () => {
  const {
    currentNote,
    setCurrentNote,
    addNote,
    updateNote
  } = useNotesStore();

  const [title, setTitle] = useState(currentNote?.title || "");
  const [content, setContent] = useState(currentNote?.content || "");
  const [editorContent, setEditorContent] = useState<Block[]>(currentNote?.editorContent || []);
  const [tags, setTags] = useState(currentNote?.tags || []);
  const [isSaved, setIsSaved] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const handleEnterKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();       // prevent newline in textarea
      textAreaRef.current?.focus(); // move focus to another text element
    }
  };

  const { open: sidebarOpen } = useSidebar();
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [key, setKey] = useState(0);
  const forceRerender = () => {
    setKey(previousKey => previousKey + 1); // Incrementing the key forces a re-render
  };

  useEffect(() => {
    setTitle(currentNote?.title || "");
    setContent(currentNote?.content || "");
    setEditorContent(currentNote?.editorContent || []);
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

  const handleContentChange = (content: string) => {
    setContent(content);
    setIsSaved(false);
    setHasUnsavedChanges(true);
  };

  const handleEditorContentChange = (editorContent: Block[]) => {
    setEditorContent(editorContent);
    setIsSaved(false);
    setHasUnsavedChanges(true);
  }

  const setTagsThenSignalChange = (noteTags: string[]) => {
    setTags(noteTags);
    setIsSaved(false);
    setHasUnsavedChanges(true);
  }

  useAutosave({
    data: {
      title,
      content,
      editorContent,
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
        editorContent: editorContent,
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
        editorContent,
        tags,
        updatedAt: new Date().toISOString()
      });
    }
    console.log("Saved: ", { title, content });
    setIsSaved(true);
  };

  return (
    // In your motion.div parent, add a height constraint:
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
        min-h-0
      `}
    >
      <NoteTitleBar
        title={title}
        content={content}
        tags={tags}
        handleTitleChange={handleTitleChange}
        handleTagsChange={setTagsThenSignalChange}
        handleEnterKeyDown={handleEnterKeyDown}
        isSaved={isSaved}
      />
      <NoteContentArea
        id={currentNote?.id ?? null}
        content={content}
        handleContentChange={handleContentChange}
        editorContent={editorContent}
        handleEditorContentChange={handleEditorContentChange}
      />
    </motion.div>
  );
};

export default NoteEditor;