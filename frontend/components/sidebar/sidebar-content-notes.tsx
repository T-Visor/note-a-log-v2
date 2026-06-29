import { ReactNode, useMemo, useRef, useState } from "react";
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
import { Ellipsis, Trash, Pencil, Calendar, ChevronDown, ListFilter, ArrowDownUp, Tags, Hash, Clock, Star } from "lucide-react";
import { Note } from "@/types";
import { useVirtualizer } from "@tanstack/react-virtual";
import { format } from "date-fns";
import { isToday, isOverdue, howManyDaysAgo, howManyDaysAhead, getNextReminderForNote } from "@/lib/date-time";
import { SidebarNote, OptimizedSidebarNotesState, TITLE_PREVIEW_CHARACTER_COUNT, CONTENT_PREVIEW_CHARACTER_COUNT } from "@/stores/useNotesStore";

interface SidebarContentNotesProps {
  sidebarNotesState: OptimizedSidebarNotesState,
  currentNote: Note | null,
  setCurrentNoteUsingID: (id: string) => void,
  deleteNote: (id: string) => void
}

type DecoratedNote = SidebarNote & {
  displayTitle: string;
  displayContent: string;
  formattedDate: string;
};

type VirtualItem = {
  labelOrNote: "label";
  text: string
} | {
  labelOrNote: "note";
  note: DecoratedNote
};

const decorateNote = (sidebarNote: SidebarNote): DecoratedNote => {
  const reminderAt = sidebarNote.reminderDate;
  return {
    ...sidebarNote,
    displayTitle: sidebarNote.titlePreview || "",
    displayContent: sidebarNote.contentPreview || "",
    formattedDate: reminderAt ? format(reminderAt, "EEE, MMM dd") : ""
  };
};

export const SidebarContentNotes = ({
  sidebarNotesState: notesState,
  currentNote,
  setCurrentNoteUsingID,
  deleteNote
}: SidebarContentNotesProps) => {
  const { 
    generalSectionNoteIDs, 
    mapIdToNote, 
    todaySectionNoteIDs, 
    upcomingSectionNoteIDs, 
    pastSectionNoteIDs 
  } = notesState;
  const sidebarNotes = generalSectionNoteIDs.map(id => mapIdToNote.get(id)).filter((item) => item !== undefined);

  const [notesFilter, setNotesFilter] = useState<"All" | "Upcoming" | "Past">("All");

  const reminderDatesAndFavoritesHash = generalSectionNoteIDs.map(id => {
    const note = mapIdToNote.get(id);
    return `${id}:${note?.reminderDate?.toString() || 0}:${note?.favorite || false}`;
  }).join(",");

  /*const items: VirtualItem[] = useMemo(() => {
    const sections: Record<string, DecoratedNote[]> = {
      Today: [],
      Past: [],
      Upcoming: [],
      General: []
    };
    const favorites: DecoratedNote[] = [];
    const restOfGeneral: DecoratedNote[] = [];

    // Single Pass: Categorize and Decorate
    for (const note of sidebarNotes) {
      const decorated = decorateNote(note);
      const { reminderDate } = decorated;

      if (isToday(reminderDate!)) {
        sections.Today.push(decorated);
      }
      else if (notesFilter === "Past" && isOverdue(reminderDate!) && (howManyDaysAgo(reminderDate!) ?? 0) >= 1) {
        sections.Past.push(decorated);
      }
      else if (notesFilter === "Upcoming" && !isOverdue(reminderDate!) && (howManyDaysAhead(reminderDate!) ?? 0) >= 1) {
        sections.Upcoming.push(decorated);
      }
      else if (notesFilter === "All") {
        if (decorated.favorite)
          favorites.push(decorated);
        else
          restOfGeneral.push(decorated);
      }
    }

    // Favorite notes first, then the rest of general notes.
    sections.General = [...favorites, ...restOfGeneral];

    // Sort: Ascending
    sections.Today.sort((a, b) => +new Date(a.reminderDate!) - +new Date(b.reminderDate!));
    sections.Upcoming.sort((a, b) => +new Date(a.reminderDate!) - +new Date(b.reminderDate!));

    // Sort: Descending
    sections.Past.sort((a, b) => +new Date(b.reminderDate!) - +new Date(a.reminderDate!));

    // Build Flat List
    const result: VirtualItem[] = [];
    const sectionOrder = ["Today", "Past", "Upcoming", "General"] as const;

    sectionOrder.forEach((key) => {
      /* Render the 'Past', 'Upcoming', 'General' sections even if there are no notes in them.
         This fixes a bug where deleting the last note in a filtered section caused the label
         to disappear, leaving no dropdown trigger to switch filters. */ /*
      const isActiveFilterSection =
        (key === "Past" && notesFilter === "Past") ||
        (key === "Upcoming" && notesFilter === "Upcoming");

      if (sections[key].length > 0 || isActiveFilterSection) {
        result.push({ labelOrNote: "label", text: key });
        sections[key].forEach(note => result.push({ labelOrNote: "note", note }));
      }
    });

    return result;
  }, [generalSectionNoteIDs, notesFilter, reminderDatesAndFavoritesHash]); */

  const items: VirtualItem[] = useMemo(() => {
    const virtualizedItems: VirtualItem[] = [];

    const todaysNotes: any[] = [];
    let restOfNotes: any[] = [];

    if (todaysNotes.length > 0) {
      // Push the 'Today' label and then today's notes.
      virtualizedItems.push({ labelOrNote: "label", "text": "Today" });
      todaysNotes.forEach((currentNote: any) => (
        { labelOrNote: "note", note: currentNote }
      ));
      virtualizedItems.push(...todaysNotes.map((currentNote: any) => (
          { labelOrNote: "note" as const, note: currentNote }
      )));
    }
    
    // Then push the label and notes for the rest.
    let sectionLabel: string;

    if (notesFilter === "All") {
      sectionLabel = "General";
      restOfNotes = generalSectionNoteIDs.map((noteID) => mapIdToNote.get(noteID));
    }
    else if (notesFilter === "Past") {
      sectionLabel = "Past";
      restOfNotes = pastSectionNoteIDs.map((noteID) => mapIdToNote.get(noteID));
    }
    else if (notesFilter === "Upcoming") {
      sectionLabel = "Upcoming";
      restOfNotes = upcomingSectionNoteIDs.map((noteID) => mapIdToNote.get(noteID));
    }

    virtualizedItems.push({ labelOrNote: "label", "text": sectionLabel! });
    virtualizedItems.push(...restOfNotes.map((currentNote: any) => (
      { labelOrNote: "note" as const, note: currentNote }
    )));

    return virtualizedItems;
  }, [todaySectionNoteIDs, notesFilter, reminderDatesAndFavoritesHash]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: (index) => (items[index].labelOrNote === "label" ? 34 : 80),
    overscan: 5,
    getItemKey: (index) => { // Added by Gemini to handle re-calculations of positioning when a note moves between sections (today and other notes)
      const item = items[index];
      console.log(item);
      return item.labelOrNote === "label" ? `label-${item.text}` : `note-${item.note.id}`;
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
                      <SidebarGroupLabel className="font-semibold pt-2 pb-1 ml-0.5">
                        {item.text}
                      </SidebarGroupLabel>
                      :
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button className="p-0 m-0 w-full" variant="ghost">
                            {/* The padding for this div and the regular sidebar group (above) are different, but these will make it look even on the UI 
                                due to the virtualization logic.*/}
                            <div className="group flex items-center justify-between w-full pt-2 pb-2">
                              <SidebarGroupLabel className="font-semibold ml-0.5">
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
                      {(() => {
                        const isCurrentNote = item.note.id === currentNote?.id;

                        const noteInfoToRender = isCurrentNote 
                          ? {
                            ...item.note,
                            displayTitle: currentNote.title.slice(0, TITLE_PREVIEW_CHARACTER_COUNT) || "",
                            displayContent: currentNote.content.slice(0, CONTENT_PREVIEW_CHARACTER_COUNT) || "",
                            reminderDate: item.note.reminderDate
                          } : item.note;

                        return (
                          <NoteRow
                            note={noteInfoToRender}
                            isActive={item.note.id === currentNote?.id}
                            onSelect={setCurrentNoteUsingID}
                            deleteNote={deleteNote}
                          />
                        )
                      })()}
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
  note: DecoratedNote;
  isActive: boolean;
  onSelect: (id: string) => void;
  deleteNote: (id: string) => void;
}

const NoteRow = ({ note, isActive, onSelect, deleteNote }: NoteRowProps) => (
  <div
    onClick={() => onSelect(note.id)}
    className={`
      select-none
      relative group/note
      ${isActive ? "bg-[#edeef2] dark:bg-gray-700" : ""}
      h-20 flex flex-col justify-start gap-3
      py-4 px-3 mx-2 rounded-sm
      hover:cursor-pointer hover:bg-[#edeef2] dark:hover:bg-gray-700
    `}
  >
    {note.favorite && (
      <div className="absolute left-1 top-2.75 bottom-2.75 w-0.5 rounded-full bg-yellow-500 dark:bg-yellow-300" />
    )}
    <div
      className="flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <NoteTitlePreview noteTitle={note.displayTitle} />
      </div>
      {(() => {
        if (note.reminderDate) {
          let preview;

          if (howManyDaysAgo(note.reminderDate) === 1)
            preview = "Yesterday";
          else if (howManyDaysAhead(note.reminderDate) === 1)
            preview = "Tomorrow";
          else if (isToday(note.reminderDate)) {
            preview = new Date(note.reminderDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit"
            });
          }
          else
            preview = note.formattedDate;

          return (
            <div
              className="
                  flex items-center gap-2 px-2 py-
                  text-[13px] text-black dark:text-white bg-gray-200 dark:bg-gray-700
                  border-1 rounded-full max-w-fit px-2
                "
            >
              {isToday(note.reminderDate)
                ? <Clock className="!size-2.5" />
                : <Calendar className="!size-2.5" />
              }
              <span>{preview}</span>
            </div>
          );
        }
        else {
          return (
            <NoteContentPreview noteContent={note.displayContent} />
          );
        }
      })()}
      {/*<NoteContextMenu note={note} deleteNote={deleteNote} /> */}
    </div>
  </div>
);

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