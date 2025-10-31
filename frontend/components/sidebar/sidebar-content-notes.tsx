import { ReactNode, useMemo, memo } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, Trash, Pencil } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Note } from "@/types";

const CHARACTER_COUNT_PREVIEW_TITLE = 50;
const CHARACTER_COUNT_PREVIEW_CONTENT = 50;

interface SidebarContentNotesProps {
  notes: Note[],
  currentNote: Note | null,
  setCurrentNote: (note: Note) => void,
  deleteNote: (id: string) => void
}

export const SidebarContentNotes = ({
  notes,
  currentNote,
  setCurrentNote,
  deleteNote
}: SidebarContentNotesProps) => {

  const sortedNotes = useMemo(
    () => [...notes].sort(
      (left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt)
    ),
    [notes]
  );

  return (
    <>
      <SidebarContent className="dark:bg-gray-800">
        <SidebarGroup />
        <SidebarGroupContent
          className="
            grid grid-cols-1 gap-3 
            py-1 overflow-auto 
            group-data-[collapsible=icon]:hidden
          "
        >
          <LayoutGroup>
            <AnimatePresence>
              {sortedNotes.map((note) => (
                <NoteRow
                  key={note.id}
                  note={note}
                  isActive={note.id === currentNote?.id}
                  onSelect={() => setCurrentNote(note)}
                  deleteNote={deleteNote}
                />
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </SidebarGroupContent>
      </SidebarContent>
    </>
  )
};

interface NoteRowProps {
  note: Note;
  isActive: boolean;
  onSelect: () => void;
  deleteNote: (id: string) => void;
}

const NoteRowComponent = ({ note, isActive, onSelect, deleteNote }: NoteRowProps) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 1 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    onClick={onSelect}
    className={`
      relative group/note
      ${isActive ? "bg-[#edeef2] dark:bg-gray-700" : ""}
      h-20 flex flex-col justify-start gap-3
      py-4 px-3 mx-2 rounded-sm
      hover:cursor-pointer hover:bg-[#edeef2] dark:hover:bg-gray-700
    `}
  >
    <div
      className="flex flex-col gap-3"
    >
      <NoteTitlePreview noteTitle={note.title.slice(0, CHARACTER_COUNT_PREVIEW_TITLE).trim()} />
      <NoteContentPreview noteContent={note.content.slice(0, CHARACTER_COUNT_PREVIEW_CONTENT).trim()} />
      <NoteContextMenu note={note} deleteNote={deleteNote} />
    </div>
  </motion.div>
);

export const NoteRow = memo(NoteRowComponent);
NoteRow.displayName = "NoteRow";

interface TextAnimatorProps {
  displayText?: string | null;
  className?: string;
  showWhenEmpty: ReactNode;
}

const TextAnimator = ({
  displayText,
  className,
  showWhenEmpty,
}: TextAnimatorProps) => {
  const textToDisplay = (displayText ?? "").trim();
  const key = textToDisplay || "__empty__";

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
    >
      <motion.span
        key={key}
        initial={{ opacity: 0, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className={className}
      >
        {textToDisplay || showWhenEmpty}
      </motion.span>
    </AnimatePresence>
  );
};

const NoteTitlePreview = ({ noteTitle }: { noteTitle: string }) => (
  <div
    className="
      truncate text-ellipsis 
      text-md font-bold
    "
  >
    <TextAnimator
      displayText={noteTitle}
      className="block truncate"
      showWhenEmpty={
        <span className="italic text-gray-500 dark:text-gray-400">
          Untitled
        </span>
      }
    />
  </div>
);

const NoteContentPreview = ({ noteContent }: { noteContent: string }) => (
  <div
    className="
      truncate text-ellipsis 
      text-xs text-gray-600 dark:text-gray-300
    "
  >
    <TextAnimator
      displayText={noteContent}
      className="block truncate"
      showWhenEmpty={
        <span className="italic text-gray-400 dark:text-gray-500">
          No content
        </span>
      }
    />
  </div>
);

interface NoteContextMenuProps {
  note: Note;
  deleteNote: (noteID: string) => void;
}

const NoteContextMenu = ({
  note,
  deleteNote
}: NoteContextMenuProps) => (
  <DropdownMenu >
    <DropdownMenuTrigger asChild>
      <Button
        key={note.id}
        className="
          absolute 
          flex opacity-0 group-hover/note:opacity-100
          right-0 top-1/2 -translate-y-1/2
          hover:bg-transparent dark:hover:bg-transparent
          data-[state=open]:opacity-100
          hover:cursor-pointer
        "
        variant="ghost"
      >
        <Ellipsis className="size-5" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      side="bottom"
      className="dark:bg-gray-900"
    >
      <DropdownMenuItem
        className="flex justify-center items-center gap-2 hover:cursor-pointer"
        onClick={(event) => {
          deleteNote(note.id);
          event.stopPropagation(); // prevents parent button from being triggered
        }}
      >
        <span>Delete</span>
        <Trash className="size-3" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);