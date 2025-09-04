"use client"

import { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import NoteTitleBarWithSave from "./note-title-bar-with-save";
import NoteContentArea from "./note-content-area";

const NoteEditor = () => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(true);
  const { open: sidebarOpen } = useSidebar();

  const handleSave = () => {
    // Your save logic here
    console.log("Saving...", { title, content });
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
    <div
      className={`
        h-full ${sidebarOpen ? "w-[80%]" : "w-[70%]"}
        flex flex-col justify-center items-center 
        transition-all duration-300 ease-in-out
      `}
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
    </div>
  );
};

export default NoteEditor;