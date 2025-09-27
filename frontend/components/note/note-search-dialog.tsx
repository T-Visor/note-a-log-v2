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

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;

const NoteSearchDialog = ({
  button
}: {button: ReactElement<HTMLButtonElement>}) => {
  const { setCurrentNote, currentNote, notes } = useNotesStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Memoize filtered notes based on debounced search term
  const filteredNotes = useMemo(() => {
    const searchQuery = debouncedSearch.toLowerCase().trim();
    const matches = (text: string) => text.toLowerCase().includes(searchQuery);

    return !searchQuery
      ? []
      : notes.filter((note: Note) =>
        matches(note.title) || matches(note.content)
      );
  }, [notes, debouncedSearch]);

  // Debounce search input to limit frequency of filtering
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim())
    }, DEBOUNCE_DELAY_IN_MILLISECONDS);
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {button}
      </DialogTrigger>
      <DialogContent className="p-0" showCloseButton={false}>
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search Notes..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {!debouncedSearch ? (
              <CommandGroup>
                {[...notes.slice(0, 3)].map((note: Note) => (
                  <CommandItem
                    key={note.id}
                    value={note.id}
                    className="grid grid-cols-[1fr_16fr] gap-1"
                    onSelect={() => {
                      setCurrentNote(note);
                      setOpen(false);
                    }}
                  >
                    <Clock />
                    <div className="grid grid-cols-1">
                      <span><strong>{note.title}</strong></span>
                      <span>{note.content}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : filteredNotes.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredNotes.map((note: Note) => (
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
                      <span>{note.content}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
};

export default NoteSearchDialog;