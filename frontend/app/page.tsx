"use client"

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Check, Save } from "lucide-react";
import { useState } from "react";
import { useSidebar } from "@/components/ui/sidebar";

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

interface NoteTitleBarWithSaveProps {
  title: string;
  content: string;
  handleTitleChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSave: () => void;
  isSaved: boolean;
}

const NoteTitleBarWithSave = ({
  title,
  content,
  handleTitleChange,
  handleSave,
  isSaved
}: NoteTitleBarWithSaveProps) => (
  <div className="relative w-full">
    <Textarea
      value={title}
      onChange={handleTitleChange}
      className="
        h-6 pr-12
        bg-gray-50 dark:bg-gray-800 dark:border-gray-800
        border-b-0 rounded-b-none
        !text-2xl font-semibold
        resize-none shadow-none
      "
      placeholder="Title"
    />

    {/* Save Button - appears when there's content */}
    {(title || content) && (
      <Button
        onClick={handleSave}
        variant="ghost"
        className="
          absolute right-2 top-3/8 -translate-y-1/2
          p-0
          text-gray-800 hover:bg-gray-100
          dark:text-gray-200 dark:hover:bg-gray-700
          hover:opacity-100
          transition-opacity
        "
      >
        {isSaved ? (
          <Check className="size-4" />
        ) : (
          <Save className="size-4" />
        )}
      </Button>
    )}
  </div>
);

interface NoteContentAreaProps {
  content: string;
  handleContentChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
}

const NoteContentArea = ({
  content,
  handleContentChange
}: NoteContentAreaProps) => (
  <Textarea
    value={content}
    onChange={handleContentChange}
    className="
      h-[85%]
      bg-gray-50 dark:bg-gray-800 dark:border-gray-800
      border-t-0 rounded-t-none
      !text-lg 
      resize-none shadow-none
    "
    placeholder="Content"
  />
);

export default NoteEditor;