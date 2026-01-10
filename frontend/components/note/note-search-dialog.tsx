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
import Fuse, { FuseResultMatch } from "fuse.js";
import { IFuseOptions, FuseResult, Expression } from "fuse.js";

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;
const CHARACTER_CONTEXT_SIZE = 200;

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
      { name: "content", weight: 0.3 },
      { name: "tags", weight: 0.45 }
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

  // Helper function to get context around first match
  const getMatchContext = (
    text: string,
    matchIndices: readonly [number, number][]
  ): string => {
    if (!matchIndices || matchIndices.length === 0)
      return text.substring(0, CHARACTER_CONTEXT_SIZE);

    const [start, end] = matchIndices[0];
    const matchLength = end - start + 1;

    // Calculate how much context to show on each side
    const remainingCharacters = CHARACTER_CONTEXT_SIZE - matchLength;
    const characterCountBeforeMatch = Math.floor(remainingCharacters / 2);
    const characterCountAfterMatch = Math.ceil(remainingCharacters / 2);

    // Calculate actual start and end positions
    const contextStart = Math.max(0, start - characterCountBeforeMatch);
    const contextEnd = Math.min(text.length, end + 1 + characterCountAfterMatch);

    // Extract the context
    let context = text.substring(contextStart, contextEnd);

    // Add ellipsis if truncated
    if (contextStart > 0) context = "..." + context;
    if (contextEnd < text.length) context = context + "...";

    return context;
  };

  /*const highlightMatch = (
    text: string,
    matchIndices: readonly [number, number][]
  ) => {
    if (!matchIndices || matchIndices.length === 0) return text;

    const fragments = [];
    let lastIndex = 0;

    matchIndices.forEach(([start, end], i) => {
      // Push normal text before match
      if (start > lastIndex) {
        fragments.push(text.slice(lastIndex, start));
      }

      // Push the highlighted match
      fragments.push(
        <mark
          key={`hl-${i}`}
          className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white px-0.5 rounded"
        >
          {text.slice(start, end + 1)}
        </mark>
      );

      lastIndex = end + 1;
    });

    // Push final trailing text
    if (lastIndex < text.length) {
      fragments.push(text.slice(lastIndex));
    }

    return fragments;
  };*/

  const getMatchingText = (
    text: string,
    matchIndices: readonly [number, number][]
  ): string => {
    if (!matchIndices || matchIndices.length === 0)
      return text;

    const [start, end] = matchIndices[0];

    return text.substring(start, end + 1);
  };

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
                  // Find the first match for title and content
                  const matchedTagsSet = new Set<string>();
                  let titleMatch: FuseResultMatch | undefined;
                  let contentMatch: FuseResultMatch | undefined;

                  noteResult.matches?.forEach((match) => {
                    if (match.key === "tags") {
                      const tag =
                        typeof match.value === "string"
                          ? match.value
                          : noteResult.item.tags?.[match.refIndex ?? -1];
                      if (tag) matchedTagsSet.add(tag);
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
                                text-xs text-gray-600 dark:text-gray-300 
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