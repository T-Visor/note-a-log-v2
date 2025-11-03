"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

import { useEffect } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";
import { Block } from "@blocknote/core";

interface NoteContentAreaProps {
  content?: string;
  handleContentChange: (content: string) => void;
  editorContent: Block[];
  handleEditorContentChange: (editorContent: Block[]) => void;
}

const NoteContentArea = ({
  content,
  handleContentChange,
  editorContent,
  handleEditorContentChange
}: NoteContentAreaProps) => {
  // Global theme
  const { theme } = useTheme();

  // Create editor with initial plain-text content
  const editor = useCreateBlockNote({
    initialContent: content
      ? [
          {
            type: "paragraph",
            content: [{ type: "text", text: content.trim() }],
          },
        ]
      : undefined,
  });

  // Subscribe to editor changes ONCE
  useEffect(() => {
    if (!editor) return;

    return editor.onChange(() => {
      // convert editor to plain text on every change
      const text = editor._tiptapEditor.getText().trim();
      handleContentChange(text);
    });
  }, [editor, handleContentChange]);

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
          editor={editor}
          theme={theme === "dark" ? "dark" : "light"}
          className="px-0 text-lg"
        />
      </div>
    </div>
  );
};

export default NoteContentArea;
