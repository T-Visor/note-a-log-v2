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
    threshold: 0.25,              // allows slight fuzziness
    distance: 50,                 // fuzzy within 50 chars (good for note text)
    ignoreLocation: true,         // keep this because notes are long
    includeScore: true,
    includeMatches: true,
    minMatchCharLength: 1,        // prevent 1-letter junk matches
    useExtendedSearch: true,      // required for ^ $
    findAllMatches: true          // get ALL occurrences in long text
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
      $and: terms.map(term => {
        const contains = `'${term}`;      // exact substring

        return {
          $or: [
            // lowest priority (controlled fuzziness)
            { title: contains },
            { content: contains },
            { tags: contains }
          ]
        };
      })
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
    }
    else {
      setSelectedNoteID("");
    }
  }, [filteredNotes]);

  filteredNotes.forEach(noteResult => {
    noteResult.matches?.forEach(match => {
      //console.table(match);

      /*match.indices.forEach(index => {
        console.log(match.value?.substring(index[0], index[1] + 1));
      })*/
      if (match.key === "content") {
        match.indices.forEach(index => {
          console.log(match.indices[0]);
          console.log(match.value?.substring(index[0], index[1] + 1));
        })
      }
    })
  });

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        {button}
      </DialogTrigger>
      <DialogContent
        className="p-0 dark:border-gray-950"
        showCloseButton={false}
      >
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
                {filteredNotes.slice(0, 20).map((noteResult) => {
                  // collect unique matched tags
                  const matchedTagsSet = new Set<string>();
                  noteResult.matches?.forEach((match) => {
                    if (match.key === "tags") {
                      const tag =
                        typeof match.value === "string"
                          ? match.value
                          : noteResult.item.tags?.[match.refIndex ?? -1];
                      if (tag) matchedTagsSet.add(tag);
                    }
                  });
                  const matchedTags = Array.from(matchedTagsSet);

                  return (
                    <CommandItem
                      key={noteResult.item.id}
                      value={noteResult.item.id}
                      className="grid grid-cols-[1fr_16fr] gap-1"
                      onSelect={() => {
                        setCurrentNote(noteResult.item);
                        setOpen(false);
                      }}
                    >
                      <NotepadText />
                      <div className="grid grid-cols-1 gap-1">
                        <span className="line-clamp-1">
                          <strong>{noteResult.item.title}</strong>
                        </span>
                        <span className="line-clamp-2">{noteResult.item.content}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedTags.map((tag) => (
                            <span
                              key={tag}
                              className="
                                rounded-full border-2 
                                px-1.5 py-0.5
                                bg-gray-100 dark:bg-gray-800 
                                text-xs text-gray-400 dark:text-gray-300 
                              "
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default NoteSearchDialog;