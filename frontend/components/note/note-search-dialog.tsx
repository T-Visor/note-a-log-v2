"use client"

import { useState, useEffect, useMemo } from "react";
import { Clock, Notebook } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const NoteSearchDialog = () => {
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
        <Button
          variant="outline"
          aria-expanded={open}
          className="w-[200px]"
        >
          {currentNote?.title || "No note set"}
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0" showCloseButton={false}>
        <Command>
          <CommandInput
            placeholder="Search Notes..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {debouncedSearch === "" ? (
              <CommandGroup>
                {[...notes.slice(0, 3)].map((note: Note) => (
                  <CommandItem
                    key={note.id}
                    value={note.content}
                    className="grid grid-cols-[1fr_16fr] gap-1"
                    onSelect={() => {
                      currentNote && setCurrentNote(currentNote);
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
                    value={note.content}
                    className="grid grid-cols-[1fr_16fr] gap-1"
                    onSelect={() => {
                      currentNote && setCurrentNote(currentNote);
                      setOpen(false);
                    }}
                  >
                    <Notebook />
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