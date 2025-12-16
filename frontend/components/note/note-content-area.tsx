"use client"

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { useEffect, useRef, MutableRefObject, RefObject } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";
import { Block, PartialBlock, BlockNoteEditor } from "@blocknote/core";
import * as Tooltip from "@/components/ui/blocknote/tooltip";
import * as Popover from "@/components/ui/blocknote/popover";
import { KeyboardEvent, ChangeEvent } from "react";

interface NoteContentAreaProps {
  title: string;
  content: string;
  tags: string[];
  handleTitleChange: (title: string) => void;
  handleTagsChange: (noteTags: string[]) => void;
  handleEnterKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  isSaved: boolean;

  noteId: string | null;
  handleContentChange: (content: string) => void;
  editorContent: Block[];
  handleEditorContentChange: (editorContent: Block[]) => void;
  contentEditorRef: RefObject<BlockNoteEditor | null>; // Change this
}

const NoteContentArea = ({
  noteId,
  handleTitleChange,
  title,
  handleContentChange,
  editorContent,
  handleEditorContentChange,
  contentEditorRef
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
    onChange: () => {
      const first = editor.document?.[0];
      if (!first)
        return;
      if (first.type !== "heading" || first.props?.level !== 2) {
        editor.updateBlock(first.id, {
          type: "heading",
          props: { level: 2 },
        });


      }
    },
  });

  useEffect(() => {
    contentEditorRef.current = editor;
  }, [editor, contentEditorRef]);

  useEffect(() => {
    if (!editor)
      return;

    const firstBlock = editor.document?.[0];
    if (!firstBlock)
      return;
    if (firstBlock.type !== "heading" || firstBlock.props?.level !== 2) {
      editor.updateBlock(firstBlock.id, {
        type: "heading",
        props: { level: 2 },
      });
    }

    if (title) {
      editor.updateBlock(editor.document[0], {
        content:
          title,
      })
    }

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
    if (noteId === currentNoteId.current)
      return;

    currentNoteId.current = noteId;

    const timer = setTimeout(() => {
      const contentToLoad: PartialBlock[] = editorContent.length > 0 ? editorContent : [
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
        border border-gray-200 dark:border-gray-800
        bg-gray-50 dark:bg-gray-800 w-full
        rounded-md
        relative shadow-md
      "
    >
      <div className="absolute inset-0 overflow-auto px-3 scrollbar-chrome-thin pt-1.5">
        <BlockNoteView
          editor={editor}
          theme={theme === "dark" ? "dark" : "light"}
          className="px-0 text-lg"
          shadCNComponents={{
            Tooltip,
            Popover
          }}
        />
      </div>
    </div>
  );
};

export default NoteContentArea;
