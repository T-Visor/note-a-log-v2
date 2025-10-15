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
import { IFuseOptions, FuseResult, Expression } from "fuse.js";

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;

const NoteSearchDialog = ({
  button
}: { button: ReactElement<HTMLButtonElement> }) => {
  const { setCurrentNote, notes } = useNotesStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedNoteID, setSelectedNoteID] = useState("");

  const fuseOptions: IFuseOptions<Note> = useMemo(() => ({
    keys: [
      { name: "title", weight: 0.45 },
      { name: "content", weight: 0.45 },
      { name: "tags", weight: 0.3 }
    ], 
    threshold: 0.3,
    ignoreLocation: true,
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,
    useExtendedSearch: true,
    findAllMatches: true
  }), []);

  const fuse: Fuse<Note> = useMemo(
    () => new Fuse(notes, fuseOptions),
    [notes, fuseOptions]
  );

  const filteredNotes = useMemo(() => {
    const raw = debouncedSearch.trim().toLowerCase();
    if (!raw) return [];

    // split on whitespace, remove empties/dupes
    const terms = Array.from(new Set(raw.split(/\s+/).filter(Boolean)));

    // Build a logical OR across fields for each term
    // Each term can match title OR content OR any tag
    const logicalQuery = {
      $and: terms.map(term => ({
        $or: [{ title: term }, { content: term }, { tags: term }],
      })),
    };

    return fuse.search(logicalQuery as Expression);
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
                      <span className="line-clamp-1"><strong>{note.title}</strong></span>
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