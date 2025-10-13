"use client"

import { useState, useEffect, useMemo, ReactElement } from "react";
import { Clock, NotepadText } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import useNotesStore from "@/stores/useNotesStore";
import { Note } from "@/types";
import Fuse from "fuse.js";
import { IFuseOptions, FuseResult } from "fuse.js";

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;

const NoteSearchDialog = ({ 
  button 
}: { button: ReactElement<HTMLButtonElement> }) => {
  const { setCurrentNote, notes } = useNotesStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedNoteID, setSelectedNoteID] = useState<string>("");

  const fuseOptions: IFuseOptions<Note> = useMemo(() => ({
    keys: ["title", "content"],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: false,
    minMatchCharLength: 1,
    useExtendedSearch: true,
  }), []);

  const fuse: Fuse<Note> = useMemo(
    () => new Fuse(notes, fuseOptions), 
    [notes, fuseOptions]
  );

  const filteredNotes: FuseResult<Note>[] = useMemo(() => {
    const trimmedSearchQuery = debouncedSearch.trim();

    if (!trimmedSearchQuery)
      return [];
    else 
      return fuse.search(trimmedSearchQuery);
  }, [fuse, debouncedSearch]);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEBOUNCE_DELAY_IN_MILLISECONDS);
    return () => clearTimeout(timeout);
  }, [search]);

  // Reset selection to first item when filtered results change
  useEffect(() => {
    if (filteredNotes.length > 0) {
      setSelectedNoteID(filteredNotes[0].item.id);
    } else {
      setSelectedNoteID("");
    }
  }, [filteredNotes]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="p-0 dark:border-gray-950" showCloseButton={false}>
        <Command 
          className="dark:bg-gray-950 p-2" 
          shouldFilter={false}
          value={selectedNoteID}
          onValueChange={setSelectedNoteID}
        >
          <CommandInput
            placeholder="Search Notes..."
            className="h-20 text-lg"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!debouncedSearch ? (
              <CommandEmpty></CommandEmpty>
            ) : filteredNotes.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredNotes.slice(0, 20).map(({ item: note }) => (
                  <CommandItem
                    key={note.id}
                    value={note.id}
                    className="grid grid-cols-[1fr_16fr] gap-1"
                    onSelect={() => {
                      setCurrentNote(note);
                      setOpen(false);
                    }}
                  >
                    <NotepadText />
                    <div className="grid grid-cols-1 gap-1">
                      <span><strong>{note.title}</strong></span>
                      <span className="line-clamp-2">{note.content}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default NoteSearchDialog;