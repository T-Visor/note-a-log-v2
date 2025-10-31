"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";


import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";

interface NoteContentAreaProps {
  content?: string;
  handleContentChange: (content: string) => void;
}

const NoteContentArea = ({
  content,
  handleContentChange,
}: NoteContentAreaProps) => {
  const editor = useCreateBlockNote();
  const { theme } = useTheme();

  editor.onChange((editor) => {
    const contentText = editor._tiptapEditor.getText().trim();
    handleContentChange(contentText);
  });
  

  return (
    <div
      className="
        flex-1 min-h-0
        border border-t-0 border-gray-200 dark:border-gray-800
        bg-gray-50 dark:bg-gray-800 w-full
        rounded-md rounded-t-none
        px-3
        relative
      "
    >
      <div className="absolute inset-0 overflow-auto px-3">
        <BlockNoteView
          defaultValue={content}
          editor={editor}
          theme={`${theme === "dark" ? "dark" : "light"}`}
          className="px-0 text-lg"
        />
      </div>
    </div>
  );
};
export default NoteContentArea;