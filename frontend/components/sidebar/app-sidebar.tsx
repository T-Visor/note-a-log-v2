import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  SquarePen,
  Search,
  ChevronUp,
  User2,
  Ellipsis,
  Trash
} from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import useNotesStore from "@/stores/useNotesStore";
import { Note } from "@/types";
import { useState } from "react";
import { useTheme } from "next-themes";

export const AppSidebar = () => {
  const {
    currentNote,
    setCurrentNote,
    clearCurrentNote,
    deleteNote,
    notes,
  } = useNotesStore();

  type Theme = "system" | "dark" | "light";
  const [menuSelectedTheme, setMenuSelectedTheme] = useState<Theme>("dark");
  const { setTheme } = useTheme();

  const handleThemeChange = (value: string) => {
    setMenuSelectedTheme(value as Theme);
    setTheme(value as Theme);
  };

  return (
    <Sidebar>
      <NotesSidebarHeader
        clearCurrentNote={clearCurrentNote}
      />
      <SidebarNotesList
        notes={notes}
        currentNote={currentNote}
        setCurrentNote={setCurrentNote}
        deleteNote={deleteNote}
      />
      <SidebarFooter className="dark:bg-gray-800 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> Username
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup 
                  value={menuSelectedTheme} 
                  onValueChange={handleThemeChange}
                >
                  <DropdownMenuRadioItem value="system">
                    System
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="light">
                    Light
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
    </Sidebar >
  );
};

interface SidebarNotesListProps {
  notes: Note[],
  currentNote: Note | null,
  setCurrentNote: (note: Note) => void,
  deleteNote: (id: string) => void
}

const SidebarNotesList = ({
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
                {/* Note title */}
                <div
                  className="
                    truncate text-ellipsis
                    text-md font-bold
                  "
                >
                  {note.title || (
                    <span
                      className="italic text-gray-500 dark:text-gray-400">
                      Untitled
                    </span>
                  )}
                </div>
                {/* Note content (preview) */}
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
                {/* Trigger for deleting note */}
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
              </motion.div>
            ))}
          </AnimatePresence>
        </LayoutGroup>
      </SidebarGroupContent>
      <SidebarGroup />
    </SidebarContent>
  </>
);

interface NotesSidebarHeaderProps {
  clearCurrentNote: () => void
}

const NotesSidebarHeader = ({
  clearCurrentNote
}: NotesSidebarHeaderProps) => (
  <SidebarHeader
    className="
      flex flex-col justify-center items-center gap-3
      dark:bg-gray-800
    "
  >
    <div className="flex flex-row justify-end gap-1">
      <div className="relative w-full">
        <Search
          className="
            absolute left-3 top-1/2 -translate-y-1/2 
            h-4 w-4 
            text-foreground
          "
        />
        <Input
          type="text"
          placeholder="Search..."
          className="
            pl-10 
            border-1 bg-gray-100 dark:border-gray-800 
            shadow-none
          "
        />
      </div>
      <Button
        variant="ghost"
        onClick={() => {
          clearCurrentNote();
        }}
      >
        <SquarePen className="size-5" />
      </Button>
    </div>
  </SidebarHeader>
)