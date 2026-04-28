import { ReactNode, useMemo, memo, useRef, useState } from "react";
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Ellipsis, Trash, Pencil, Calendar, ChevronDown, ListFilter, ArrowDownUp } from "lucide-react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Note } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { isToday, isOverdue, howManyDaysAgo, howManyDaysAhead, getNextReminderForNote } from "@/lib/date-time";

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
  const [notesFilter, setNotesFilter] = useState<"All" | "Upcoming" | "Past">("All");

  const currentReminder = useMemo(() => {
    if (currentNote?.reminders)
      return getNextReminderForNote(currentNote?.reminders);
  }, [currentNote?.reminders]);

  type VirtualItem = {
    kind: "label";
    text: string
  } | {
    kind: "note";
    note: Note
  };

  const items: VirtualItem[] = useMemo(() => {
    const todaysNotes: Note[] = [];
    const pastNotes: Note[] = [];
    const upcomingNotes: Note[] = [];
    const restOfNotes: Note[] = [];
    let todaysNotesSection: any;
    let pastNotesSection: any;
    let upcomingNotesSection: any;
    let restOfNotesSection: any;

    const decoratedNotes = notes.map(note => {
      return {
        ...note,
        reminderAt: getNextReminderForNote(note.reminders || [])
      }
    });

    decoratedNotes.forEach((note) => {
      if (isToday(note.reminderAt!))
        todaysNotes.push(note);
      else if (isOverdue(note.reminderAt!) && howManyDaysAgo(note.reminderAt!)! >= 1 && notesFilter === "Past")
        pastNotes.push(note);
      else if (!isOverdue(note.reminderAt!) && howManyDaysAhead(note.reminderAt!)! >= 1 && notesFilter === "Upcoming")
        upcomingNotes.push(note);
      else if (notesFilter === "All")
        restOfNotes.push(note);
    });

    if (!todaysNotes.length && !pastNotes.length && !upcomingNotes.length) {
      todaysNotesSection = [];
      pastNotesSection = [];
      upcomingNotesSection = [];
      restOfNotesSection = [
        { kind: "label" as const, text: "General" },
        ...restOfNotes.map((note) => (
          { kind: "note" as const, note }
        ))
      ];
    }
    else {
      if (todaysNotes.length > 0) {
        // ascending order sort.
        todaysNotes.sort((left, right) => +new Date(left.reminderAt!) - +new Date(right.reminderAt!));

        todaysNotesSection = [
          { kind: "label" as const, text: "Today" },
          ...todaysNotes.map((note) => (
            { kind: "note" as const, note }
          ))
        ];
      }
      else
        todaysNotesSection = [];

      if (upcomingNotes.length > 0) {
        // ascending order sort.
        upcomingNotes.sort((left, right) => +new Date(left.reminderAt!) - +new Date(right.reminderAt!));

        upcomingNotesSection = [
          { kind: "label" as const, text: "Upcoming" },
          ...upcomingNotes.map((note) => (
            { kind: "note" as const, note }
          ))
        ];
      }
      else
        upcomingNotesSection = [];

      if (pastNotes.length > 0) {
        // ascending order sort.
        pastNotes.sort((left, right) => +new Date(right.reminderAt!) - +new Date(left.reminderAt!));

        pastNotesSection = [
          { kind: "label" as const, text: "Past" },
          ...pastNotes.map((note) => (
            { kind: "note" as const, note }
          ))
        ];
      }
      else
        pastNotesSection = [];

      if (restOfNotes.length > 0) {
        restOfNotesSection = [
          { kind: "label", text: "General" },
          ...restOfNotes.map((note) => ({ kind: "note" as const, note })),
        ];
      }
      else
        restOfNotesSection = [];
    }

    return [...todaysNotesSection, ...pastNotesSection, ...upcomingNotesSection, ...restOfNotesSection];
  }, [notes, notesFilter]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => (items[index].kind === "label" ? 34 : 80),
    overscan: 5,
    getItemKey: (index) => { // Added by Gemini to handle re-calculations of positioning when a note moves between sections (today and other notes)
      const item = items[index];
      return item.kind === "label" ? `label-${item.text}` : `note-${item.note.id}`;
    },
  });

  return (
    <SidebarContent className="dark:bg-gray-800">
      <SidebarGroup />
      <SidebarGroupContent
        className="overflow-hidden flex flex-col group-data-[collapsible=icon]:hidden"
      >
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-auto scrollbar-chrome-thin"
        >
          <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const item = items[virtualItem.index];

              return (
                <div
                  key={virtualItem.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  {item.kind === "label" ? (
                    item.text === "Today"
                      ?
                      <SidebarGroupLabel className="font-semibold pt-2 pb-1 ml-0.5">
                        {item.text}
                      </SidebarGroupLabel>
                      :
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="p-0 m-0 w-full" variant="ghost">
                            {/* The padding for this div and the regular sidebar group (above) are different, but these will make it look even on the UI 
                                due to the virtualization logic.*/}
                            <div className="flex items-center justify-between w-full pt-2 pb-2">
                              <SidebarGroupLabel className="font-semibold ml-0.5">
                                {item.text}
                              </SidebarGroupLabel>
                              <ListFilter className="!size-3 mr-5 text-muted-foreground" />
                            </div>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end">
                          <DropdownMenuItem onClick={() => setNotesFilter("All")}>
                            All Notes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setNotesFilter("Past")}>
                            Past
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setNotesFilter("Upcoming")}>
                            Upcoming
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                  ) : (
                    <div>
                      <NoteRow
                        note={item.note}
                        isActive={item.note.id === currentNote?.id}
                        onSelect={setCurrentNote}
                        deleteNote={deleteNote}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarContent>
  );
};

interface NoteRowProps {
  note: Note;
  isActive: boolean;
  onSelect: (note: Note) => void;
  deleteNote: (id: string) => void;
}

const NoteRowComponent = ({ note, isActive, onSelect, deleteNote }: NoteRowProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 1 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 1 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
    onClick={() => onSelect(note)}
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
      <NoteTitlePreview noteTitle={note.title?.slice(0, CHARACTER_COUNT_PREVIEW_TITLE) || ""} />
      {(() => {
        if (note.reminderAt && !isToday(note.reminderAt)) {
          let preview;

          if (howManyDaysAgo(note.reminderAt) === 1)
            preview = "Yesterday";
          else if (howManyDaysAhead(note.reminderAt) === 1)
            preview = "Tomorrow";
          else
            preview = format(note.reminderAt, "EEE, MMM dd");

          return (
            <div
              className="
                  flex items-center gap-2 px-2 py-
                  text-[13px] text-black dark:text-white bg-gray-200 dark:bg-gray-700
                  border-1 rounded-full max-w-fit px-2
                "
            >
              <Calendar className="!size-2.5" />
              <span>{preview}</span>
            </div>
          );
        }
        else {
          return (
            <NoteContentPreview noteContent={note.content?.slice(0, CHARACTER_COUNT_PREVIEW_CONTENT) || ""} />
          );
        }
      })()}
      {/*<NoteContentPreview noteContent={note.content?.slice(0, CHARACTER_COUNT_PREVIEW_CONTENT) || ""} /> */}
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
          event.stopPropagation(); // prevents parent button from being triggered
          event.preventDefault();
          deleteNote(note.id);
        }}
      >
        <span>Delete</span>
        <Trash className="size-3" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);