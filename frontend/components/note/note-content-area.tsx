"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";

interface NoteContentAreaProps {
  // Keeping your original props for future expansion
  content?: string;
  handleContentChange?: () => void;
}

const NoteContentArea = ({
  content,
  handleContentChange,
}: NoteContentAreaProps) => {
  // Create the BlockNote editor instance
  const editor = useCreateBlockNote();
  const { theme } = useTheme();

  return (
    <div
      className="
        flex-1
        border border-t-0 border-gray-200 dark:border-gray-800
        bg-gray-50 dark:bg-gray-800 w-full
        rounded-md rounded-t-none
        overflow-y-scroll px-3
      "
    >
      <BlockNoteView
        editor={editor}
        theme={`${theme === "dark" ? "dark" : "light"}`}
        className="min-h-[400px] px-0 text-lg"
      />
    </div>
  );
};

export default NoteContentArea;
