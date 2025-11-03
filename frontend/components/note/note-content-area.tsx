"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";
import { Block } from "@blocknote/core";

interface NoteContentAreaProps {
  id: string | null;
  content?: string;
  handleContentChange: (content: string) => void;
  editorContent: Block[];
  handleEditorContentChange: (editorContent: Block[]) => void;
}

const NoteContentArea = ({
  id,
  content,
  handleContentChange,
  editorContent,
  handleEditorContentChange
}: NoteContentAreaProps) => {
  const { theme } = useTheme();
  const currentNoteId = useRef(id);

  const editor = useCreateBlockNote({
    initialContent: editorContent.length > 0 ? editorContent : undefined,
  });

  useEffect(() => {
    if (!editor) return;
    if (id === currentNoteId.current) return;

    currentNoteId.current = id;

    // Delay replaceBlocks to prevent flickering render of slash menu prompt
    const timer = setTimeout(() => {
      editor.replaceBlocks(editor.document, editorContent);
    }, 200);

    return () => clearTimeout(timer);
  }, [editor, id, editorContent]);


  // Subscribe to editor changes ONCE
  useEffect(() => {
    if (!editor) return;

    return editor.onChange(() => {
      const text = editor._tiptapEditor.getText().trim();
      handleContentChange(text);
      handleEditorContentChange(editor.document);
    });
  }, [editor, handleContentChange, handleEditorContentChange]);

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
