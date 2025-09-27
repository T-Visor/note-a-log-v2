"use client"

import { useState, useEffect, useMemo } from "react";
import { ChevronsUpDown, Clock } from "lucide-react";
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

const SearchDialog = () => {
  const { setCurrentNote, notes } = useNotesStore();
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
};