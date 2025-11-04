"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { useEffect, useRef } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";
import { Block } from "@blocknote/core";

interface NoteContentAreaProps {
  noteId: string | null;
  handleContentChange: (content: string) => void;
  editorContent: Block[];
  handleEditorContentChange: (editorContent: Block[]) => void;
}

const NoteContentArea = ({
  noteId,
  handleContentChange,
  editorContent,
  handleEditorContentChange
}: NoteContentAreaProps) => {
  const { theme } = useTheme();
  const currentNoteId = useRef(noteId);
  const isInitialMount = useRef(true);

  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: ""
      }
    ],
  });

  useEffect(() => {
    if (!editor) return;
    
    // On initial mount, load the content if it exists
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (editorContent.length > 0) {
        editor.replaceBlocks(editor.document, editorContent);
      }
      currentNoteId.current = noteId;
      return;
    }

    // If id changed from null to a value (new note saved), don't replace
    if (currentNoteId.current === null && noteId !== null) {
      currentNoteId.current = noteId;
      return;
    }

    // Only replace blocks when switching between different existing notes
    if (noteId === currentNoteId.current) return;

    currentNoteId.current = noteId;

    const timer = setTimeout(() => {
      const contentToLoad = editorContent.length > 0 ? editorContent : [
        {
          type: "paragraph",
          content: ""
        }
      ];
      editor.replaceBlocks(editor.document, contentToLoad);
    }, 200);

    return () => clearTimeout(timer);
  }, [editor, noteId]);



  // Subscribe to editor changes ONCE
  useEffect(() => {
    if (!editor) return;

    return editor.onChange(() => {
      handleContentChange(editor.blocksToMarkdownLossy());
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
