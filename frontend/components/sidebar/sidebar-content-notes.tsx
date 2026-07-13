import React, { ReactNode, useMemo, useRef, useState } from "react";
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
import { Calendar, ListFilter, Clock } from "lucide-react";
import { Note } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { isToday, howManyDaysAgo, howManyDaysAhead } from "@/lib/date-time";
import useNotesStore, { OptimizedSidebarNotesState } from "@/stores/useNotesStore";
import { useShallow } from "zustand/react/shallow"; // Make sure to add this import!

interface SidebarContentNotesProps {
  sidebarNotesState: OptimizedSidebarNotesState,
  currentNote: Note | null,
  setCurrentNoteUsingID: (id: string) => void,
}

type VirtualItem = {
  labelOrNote: "label";
  text: string;
} | {
  labelOrNote: "note";
  noteID: string;
};


export const SidebarContentNotes = ({
  sidebarNotesState,
  currentNote,
  setCurrentNoteUsingID,
}: SidebarContentNotesProps) => {
  const {
    generalSectionNoteIDs,
    todaySectionNoteIDs,
    upcomingSectionNoteIDs,
    pastSectionNoteIDs
  } = useNotesStore(
    useShallow((state) => ({
      generalSectionNoteIDs: state.sidebarNotesState.generalSectionNoteIDs,
      todaySectionNoteIDs: state.sidebarNotesState.todaySectionNoteIDs,
      upcomingSectionNoteIDs: state.sidebarNotesState.upcomingSectionNoteIDs,
      pastSectionNoteIDs: state.sidebarNotesState.pastSectionNoteIDs,
    }))
  );
  const [notesFilter, setNotesFilter] = useState<"All" | "Upcoming" | "Past">("All");

  const items: VirtualItem[] = useMemo(() => {
    const virtualizedItems: VirtualItem[] = [];
    let restOfNotes: any[] = [];

    if (todaySectionNoteIDs.length > 0) {
      // Push the 'Today' label and then today's notes.
      virtualizedItems.push({ labelOrNote: "label", "text": "Today" });
      virtualizedItems.push(...todaySectionNoteIDs.map((noteID: string) => (
        { labelOrNote: "note" as const, noteID: noteID }
      )));
    }

    // Then push the label and notes for the rest.
    let sectionLabel: string;

    if (notesFilter === "All") {
      sectionLabel = "General";
      restOfNotes = generalSectionNoteIDs;
    }
    else if (notesFilter === "Past") {
      sectionLabel = "Past";
      restOfNotes = pastSectionNoteIDs;
    }
    else if (notesFilter === "Upcoming") {
      sectionLabel = "Upcoming";
      restOfNotes = upcomingSectionNoteIDs;
    }

    virtualizedItems.push({ labelOrNote: "label", "text": sectionLabel! });
    virtualizedItems.push(...restOfNotes.map((noteID: string) => (
      { labelOrNote: "note" as const, noteID: noteID }
    )));

    return virtualizedItems;
  }, [todaySectionNoteIDs, notesFilter, generalSectionNoteIDs]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => (items[index].labelOrNote === "label" ? 34 : 80),
    overscan: 5,
    getItemKey: (index) => { // Added by Gemini to handle re-calculations of positioning when a note moves between sections (today and other notes)
      const item = items[index];
      return item.labelOrNote === "label" ? `label-${item.text}` : `note-${item.noteID}`;
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
                  {item.labelOrNote === "label" ? (
                    item.text === "Today"
                      ?
                      <SidebarGroupLabel className="font-semibold pt-2 pb-1 ml-0.5 uppercase tracking-wider text-foreground/80">
                        {item.text}
                      </SidebarGroupLabel>
                      :
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="p-0 m-0 w-full" variant="ghost">
                            {/* The padding for this div and the regular sidebar group (above) are different, but these will make it look even on the UI 
                                due to the virtualization logic.*/}
                            <div className="group flex items-center justify-between w-full pt-2 pb-2">
                              <SidebarGroupLabel className="font-semibold ml-0.5 uppercase tracking-wider text-foreground/80">
                                {item.text}
                              </SidebarGroupLabel>
                              <ListFilter className="!size-3 mr-[21px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" /> {/*Aligns perfectly with the favorite 'stars' on each note */}
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
                        noteID={item.noteID}
                        isActive={item.noteID === currentNote?.id}
                        onSelect={setCurrentNoteUsingID}
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
  noteID: string;
  isActive: boolean;
  onSelect: (id: string) => void;
}

const NoteRow = React.memo(({ noteID, isActive, onSelect }: NoteRowProps) => {
  const sidebarNote = useNotesStore(state => state.sidebarNotesState.mapIdToNote.get(noteID));

  return (
    <div
      onClick={() => onSelect(noteID)}
      className={`
      select-none
      relative group/note
      ${isActive ? "bg-[#edeef2] dark:bg-gray-700" : ""}
      h-20 flex flex-col justify-start gap-3
      py-4 px-3 mx-2 rounded-sm
      hover:cursor-pointer hover:bg-[#edeef2] dark:hover:bg-gray-700
    `}
    >
      {sidebarNote?.favorite && (
        <div className="absolute left-1 top-3 bottom-3 w-0.5 rounded-full bg-amber-400 dark:bg-yellow-500" />
      )}
      <div
        className="flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <NoteTitlePreview noteTitle={sidebarNote?.titlePreview || ""} />
        </div>
        {(() => {
          if (sidebarNote?.reminderDate) {
            let preview;

            if (howManyDaysAgo(sidebarNote.reminderDate) === 1)
              preview = "Yesterday";
            else if (howManyDaysAhead(sidebarNote.reminderDate) === 1)
              preview = "Tomorrow";
            else if (isToday(sidebarNote.reminderDate)) {
              preview = new Date(sidebarNote.reminderDate).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
              });
            }
            else {
              preview = new Date(sidebarNote.reminderDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
              });
            }

            return (
              <div
                className="
                  flex items-center gap-2 px-2 py-
                  text-[13px] text-black dark:text-white bg-gray-200 dark:bg-gray-700
                  border-1 rounded-full max-w-fit px-2
                "
              >
                {isToday(sidebarNote.reminderDate)
                  ? <Clock className="!size-2.5" />
                  : <Calendar className="!size-2.5" />
                }
                <span>{preview}</span>
              </div>
            );
          }
          else {
            return (
              <NoteContentPreview noteContent={sidebarNote?.contentPreview || ""} />
            );
          }
        })()}
      </div>
    </div>
  );
});

interface TextAnimatorProps {
  displayText?: string | null;
  className?: string;
  showWhenEmpty: ReactNode;
}

const TextPreview = ({
  displayText,
  className,
  showWhenEmpty,
}: TextAnimatorProps) => {
  const textToDisplay = (displayText ?? "").trim();

  return (
    <span className={className}>
      {textToDisplay || showWhenEmpty}
    </span>
  );
};

const NoteTitlePreview = ({ noteTitle }: { noteTitle: string }) => (
  <div
    className="
      truncate text-ellipsis 
      text-md font-bold
    "
  >
    <TextPreview
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
    <TextPreview
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

/*interface NoteContextMenuProps {
  note: Note;
  deleteNote: (noteID: string) => void;
}*/

/*const NoteContextMenu = ({
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
);*/