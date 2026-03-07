"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";
import { useEffect, useRef, MutableRefObject, RefObject } from "react";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { useTheme } from "next-themes";
import { Block, PartialBlock, BlockNoteEditor } from "@blocknote/core";
import * as Tooltip from "@/components/ui/blocknote/tooltip";
import * as Popover from "@/components/ui/blocknote/popover";
import * as DropdownMenu from "@/components/ui/blocknote/dropdown-menu";
import { KeyboardEvent, ChangeEvent } from "react";

interface NoteContentAreaProps {
  handleTitleChange: (title: string) => void;
  noteId: string | null;
  handleContentChange: (content: string) => void;
  editorContent: Block[];
  handleEditorContentChange: (editorContent: Block[]) => void;
  contentEditorRef: RefObject<BlockNoteEditor | null>;
}

const NoteContentArea = ({
  handleTitleChange,
  noteId,
  handleContentChange,
  editorContent,
  handleEditorContentChange,
  contentEditorRef
}: NoteContentAreaProps) => {
  const { theme } = useTheme();
  const currentNoteId = useRef(noteId);
  const isInitialMount = useRef(true);

  const ensureLeadingH2 = () => {
    const firstLine = editor.document?.[0];
    if (!firstLine)
      return;

    const isfirstLineH2 = firstLine.type === "heading" && firstLine.props?.level === 2;

    if (!isfirstLineH2) {
      editor.updateBlock(firstLine.id, {
        type: "heading",
        props: { level: 2 },
      });
    }
  };

  const editor = useCreateBlockNote({
    initialContent: [
      {
        type: "paragraph",
        content: ""
      }
    ],
    onChange: () => {
      ensureLeadingH2();
    },
  });

  useEffect(() => {
    contentEditorRef.current = editor;
  }, [editor, contentEditorRef]);

  useEffect(() => {
    if (!editor)
      return;

    ensureLeadingH2();

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

  /* Subscribe to editor changes ONCE */
  useEffect(() => {
    if (!editor) 
      return;

    return editor.onChange(() => {
      // Extract title from first block
      const firstBlock = editor.document[0];
      const titleText =
        Array.isArray(firstBlock?.content)
          ? firstBlock.content
            .map((item: any) => (typeof item === "string" ? item : item?.text ?? ""))
            .join("")
          : "";

      handleTitleChange(titleText);
      handleContentChange(editor.blocksToMarkdownLossy(editor.document.slice(1)));
      handleEditorContentChange(editor.document);
    });
  }, [editor, handleContentChange, handleEditorContentChange, handleTitleChange]);

  return (
    <div
      className="
        flex-1 min-h-0
        border border-gray-200 dark:border-gray-800
        bg-gray-50 dark:bg-gray-800 w-full
        rounded-none sm:rounded-md
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
            Popover,
            DropdownMenu
          }}
        />
      </div>
    </div>
  );
};

export default NoteContentArea;