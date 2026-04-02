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
import { SuggestionMenuController } from "@blocknote/react";
import * as chrono from "chrono-node";
import { format } from "date-fns";
import { CalendarClock, CalendarPlus } from "lucide-react";
import useNotesStore from "@/stores/useNotesStore";
import { createReactBlockSpec } from "@blocknote/react";
import { defaultProps } from "@blocknote/core";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { createReactInlineContentSpec } from "@blocknote/react";
import { InlineContentSchema, defaultInlineContentSpecs } from "@blocknote/core";

const openInGoogleCalendar = (
  date: Date, 
  noteID: string, 
  editor: BlockNoteEditor
) => {
  if (!date) return;

  const firstBlock = editor.document[0];
  const titleText =
    Array.isArray(firstBlock?.content)
      ? firstBlock.content
          .map((item: any) => (typeof item === "string" ? item : item?.text ?? ""))
          .join("")
      : "";
  const title = encodeURIComponent(titleText);
  const noteUrl = encodeURIComponent(`${window.location.origin}/note/?id=${noteID}`);

  const startDate = format(date, "yyyyMMdd'T'HHmmss");
  const endDate = format(new Date(date.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss"); // add 1 hour

  const googleCalendarURL = `https://www.google.com/calendar/render?action=TEMPLATE&text=${title}&details=Link+to+note:+${noteUrl}&dates=${startDate}/${endDate}`;
  window.open(googleCalendarURL, "_blank");
};

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
  const { updateNote } = useNotesStore();

  const DateBadge = createReactInlineContentSpec(
    {
      type: "dateBadge",
      propSchema: {
        date: { default: "" },
      },
      content: "none",
    },
    {
      render: (props) => (
        <span
          title="Open in Google Calendar"
          className="
          inline-flex items-center 
          gap-2 px-1.5
          rounded-md
          text-sm font-semibold border-1
          bg-gray-200/50 text-blue-700 
          dark:bg-gray-700/50 dark:text-blue-200
          hover:cursor-pointer
        "
          onClick={() => {
            const parsedDate = chrono.parseDate(props.inlineContent.props.date);
            if (!parsedDate)
              return;
            openInGoogleCalendar(parsedDate, currentNoteId.current!, editor as any);
          }}
        >
          <CalendarPlus className="!size-4 opacity-70" />
          {props.inlineContent.props.date}
        </span>
      ),
    }
  );

  const editor = useCreateBlockNote({
    schema: BlockNoteSchema.create({
      blockSpecs: { ...defaultBlockSpecs },
      inlineContentSpecs: {
        ...defaultInlineContentSpecs,
        dateBadge: DateBadge,
      },
    }),
    initialContent: [
      {
        type: "paragraph",
        content: ""
      }
    ],
    placeholders: {
      default: "Use '/' for formatting and '@' for date pinning",
    },
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
    contentEditorRef.current = editor as any;
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
      handleEditorContentChange(editor.document as any);
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
        >
          <SuggestionMenuController
            triggerCharacter={"@"}
            getItems={async (query) => {
              // query is everything after the @ (e.g., "remind me Friday")
              const parsedDate = chrono.parseDate(query);

              if (!parsedDate) {
                return [
                  {
                    title: "Date Pin",
                    subtext: "(e.g. 'friday', 'next week')",
                    onItemClick: () => { }, // no-op placeholder
                    icon: <CalendarClock size={18} />,
                  },
                ];
              }

              return [
                {
                  title: `${format(parsedDate!, "EEE, MMM dd, hh:mm aa")}`,
                  onItemClick: () => {
                    editor.insertInlineContent([
                      {
                        type: "dateBadge",
                        props: { date: format(parsedDate, "EEE, MMM dd, hh:mm aa") },
                      },
                    ]);
                    updateNote(currentNoteId?.current!, {
                      reminderAt: parsedDate.toISOString(),
                    });
                  },
                },
              ];
            }}
          />
        </BlockNoteView>
      </div>
    </div>
  );
};

export default NoteContentArea;