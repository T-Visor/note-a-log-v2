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
import { Ellipsis, Trash } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Note } from "@/types";

interface SidebarNotesListProps {
  notes: Note[],
  currentNote: Note | null,
  setCurrentNote: (note: Note) => void,
  deleteNote: (id: string) => void
}

export const SidebarNotesList = ({
  notes,
  currentNote,
  setCurrentNote,
  deleteNote
}: SidebarNotesListProps) => (
  <>
    <SidebarContent className="dark:bg-gray-800">
      <SidebarGroup />
      <SidebarGroupContent className="py-1 overflow-auto grid grid-cols-1 gap-3">
        <LayoutGroup>
          <AnimatePresence>
            {/* Most recent notes are at the top */}
            {/* Notes animate on the sidebar when they appear, disappear, or get updated */}
            {[...notes].sort(
              (left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt)
            ).map((note) => (
              <motion.div
                key={note.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={() => setCurrentNote(note)}
                className={`
                  relative group/note
                  ${note?.id === currentNote?.id ? "bg-[#edeef2] dark:bg-gray-700" : ""}
                  h-20
                  flex flex-col justify-start gap-3
                  py-4 px-3 mx-2
                  rounded-sm
                  hover:bg-[#edeef2] dark:hover:bg-gray-700
                `}
              >
                <NoteTitlePreview 
                  note={note} 
                />
                <NoteContentPreview 
                  note={note} 
                />
                <NoteContextMenu 
                  note={note} 
                  deleteNote={deleteNote}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </SidebarGroupContent>
      <SidebarGroup />
    </SidebarContent>
  </>
);

const NoteTitlePreview = ({ note }: { note: Note }) => (
  <div
    className="
      truncate text-ellipsis
      text-md font-bold
    "
  >
    {note.title || (
      <span className="italic text-gray-500 dark:text-gray-400">
        Untitled
      </span>
    )}
  </div>
);

const NoteContentPreview = ({ note }: { note: Note }) => (
  <div
    className="
      truncate text-ellipsis
      text-xs text-gray-600 dark:text-gray-300
    "
  >
    {note.content || (
      <span className="italic text-gray-400 dark:text-gray-500">
        No content
      </span>
    )}
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
        className="flex justify-center items-center gap-2"
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
)