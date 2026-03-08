"use client";

import { useState, useEffect, useMemo, ReactElement } from "react";
import { MapPin } from "lucide-react";
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
import Fuse, { FuseResultMatch } from "fuse.js";
import { IFuseOptions, FuseResult, Expression } from "fuse.js";
import { create, search as searchOrama, insert, insertMultiple } from "@orama/orama";
import { set } from "zod";

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;
const CHARACTER_CONTEXT_SIZE = 200;
const SEARCH_RESULTS_LIMIT = 20;

const NoteSearchDialog = ({
  button
}: { button: ReactElement<HTMLButtonElement> }) => {
  const { setCurrentNote, notes } = useNotesStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedNoteID, setSelectedNoteID] = useState("");

  // Create a new Orama instance
  const searchableNotesIndex = create({
    schema: {
      title: "string",
      content: "string",
      tags: "string[]",
      location: "string"
    },
  });

  const searchableNotes = notes.map(
    ({ title, content, tags, location }: Note) => ({
      title,
      content,
      tags,
      location
    })
  );

  // search the index and get the raw search results 'hits'
  const searchHits: any = useMemo(() => {
    const searchResultWithHits: any = searchOrama(searchableNotesIndex, {
      term: debouncedSearch.trim().toLowerCase(),
      limit: SEARCH_RESULTS_LIMIT
    });
    return searchResultWithHits.hits;
  }, [debouncedSearch]);

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEBOUNCE_DELAY_IN_MILLISECONDS);
    return () => clearTimeout(timeout);
  }, [search]);

  // If there are search results,
  // reset selection to first item when filtered results change
  useEffect(() => {
    searchHits.length > 0 
      ? setSelectedNoteID(searchHits[0].id)
      : setSelectedNoteID("");
  }, [searchHits]);

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
            ) : searchHits.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {searchHits.map((noteResult: any) => {
                  // Find the first match for title and content
                  const matchedTagsSet = new Set<string>();
                  let locationMatch: FuseResultMatch | undefined;
                  let titleMatch: FuseResultMatch | undefined;
                  let contentMatch: FuseResultMatch | undefined;

                  noteResult.matches?.forEach((match) => {
                    if (match.key === "tags") {
                      const tag =
                        typeof match.value === "string"
                          ? match.value
                          : noteResult.item.tags?.[match.refIndex ?? -1];
                      if (tag)
                        matchedTagsSet.add(tag);
                    }
                    else if (match.key === "location") {
                      locationMatch = match;
                    }
                    else if (match.key === "title" && !titleMatch) {
                      titleMatch = match;
                    }
                    else if (match.key === "content" && !contentMatch) {
                      contentMatch = match;
                    }
                  });

                  // Get context for title and content
                  const titleContext = titleMatch! && titleMatch.value && titleMatch.indices
                    ? getMatchContext(titleMatch.value, titleMatch.indices)
                    : noteResult.item.title;

                  const contentContext = contentMatch! && contentMatch.value && contentMatch.indices
                    ? getMatchContext(contentMatch.value, contentMatch.indices)
                    : noteResult.item.content.substring(0, CHARACTER_CONTEXT_SIZE) +
                    (noteResult.item.content.length > CHARACTER_CONTEXT_SIZE ? "..." : "");

                  const locationContext = locationMatch! && locationMatch.value && locationMatch.indices
                    ? getMatchContext(locationMatch.value, locationMatch.indices)
                    : noteResult.item.location;

                  const matchedTags = Array.from(matchedTagsSet);

                  return (
                    <CommandItem
                      key={noteResult.item.id}
                      value={noteResult.item.id}
                      className="grid grid-cols-1 mx-2"
                      onSelect={() => {
                        setCurrentNote(noteResult.item);
                        setOpen(false);
                      }}
                    >
                      <div className="grid grid-cols-1 gap-1">
                        <span className="line-clamp-1">
                          <strong>
                            {titleContext}
                            {/*titleMatch ? getMatchingText(noteResult.item.title, titleMatch.indices) : <></>*/}
                          </strong>
                        </span>
                        <span className="line-clamp-2">
                          {contentContext}
                          {/*contentMatch ? getMatchingText(noteResult.item.content, contentMatch.indices) : <></>*/}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedTags.map((tag) => (
                            <span
                              key={tag}
                              className="
                                rounded-full border-2 
                                px-1.5 py-0.5
                                bg-gray-100 dark:bg-gray-800 
                                text-xs text-gray-700 dark:text-gray-300 
                              "
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                        {locationMatch && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md">
                              <MapPin className="size-3 text-red-600 dark:text-red-500" />
                              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                                {locationContext}
                              </span>
                            </div>
                          </div>
                        )}
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