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
import { create, search as searchOrama, insertMultiple } from "@orama/orama";
import { Highlight } from "@orama/highlight";

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;
const CHARACTER_CONTEXT_SIZE = 200;
const SEARCH_RESULTS_LIMIT = 20;

// Initialize Highlighter outside to avoid re-instantiation
const highlighter = new Highlight({
  HTMLTag: "mark",
  CSSClass: "bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 rounded-sm px-0.5",
});

const NoteSearchDialog = ({
  button
}: { button: ReactElement<HTMLButtonElement> }) => {
  const { setCurrentNoteUsingID, oramaIndex } = useNotesStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedNoteID, setSelectedNoteID] = useState("");

  // Debounce search input
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEBOUNCE_DELAY_IN_MILLISECONDS);
    return () => clearTimeout(timeout);
  }, [search]);

  // Search the index
  const searchHits = useMemo(() => {
    if (!debouncedSearch)
      return [];

    const results: any = searchOrama(oramaIndex, {
      term: debouncedSearch.toLowerCase(),
      limit: SEARCH_RESULTS_LIMIT
    });

    return results.hits;
  }, [debouncedSearch, oramaIndex]);

  // Handle automatic highlighting of the first result
  useEffect(() => {
    if (searchHits.length > 0)
      // CRITICAL: Must be lowercase to match cmdk internal state
      setSelectedNoteID(searchHits[0].id.toLowerCase());
    else 
      setSelectedNoteID("");
  }, [searchHits]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="p-0 dark:border-gray-950" showCloseButton={false}>
        <Command
          className="dark:bg-gray-950 p-2"
          shouldFilter={false} // We handle filtering via Orama
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
                {searchHits.map((searchHit: any) => {
                  const cleanSearchTerms: string[] = debouncedSearch.toLowerCase().trim().split(" ");

                  const tagsContainingMatchingTerms = searchHit.document.tags.filter((tag: string) => {
                    const lowerTag = tag.toLowerCase();
                    // Return true if ANY of the search words are found inside this specific tag
                    return cleanSearchTerms.some(term => term.length > 0 && lowerTag.includes(term));
                  });

                  return (
                    <CommandItem
                      key={searchHit.id}
                      /**
                       * CRITICAL: value must be the ID and lowercased.
                       * If removed, cmdk uses innerText, which breaks auto-highlighting.
                       */
                      value={searchHit.id.toLowerCase()}
                      className="grid grid-cols-1 mx-2 cursor-pointer"
                      onSelect={async () => {
                        // Use the original case-sensitive ID for the store
                        await setCurrentNoteUsingID(searchHit.document.id);
                        setOpen(false);
                      }}
                    >
                      <div className="grid grid-cols-1 gap-1">
                        <span className="line-clamp-1">
                          <strong
                            dangerouslySetInnerHTML={{
                              __html: highlighter.highlight(searchHit.document.title, debouncedSearch).HTML
                            }}
                          />
                        </span>
                        <span
                          className="line-clamp-2 text-sm text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: highlighter.highlight(
                              searchHit.document.content.slice(0, CHARACTER_CONTEXT_SIZE),
                              debouncedSearch
                            ).HTML
                          }}
                        />

                        {searchHit.document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {tagsContainingMatchingTerms.map((tag: string) => (
                              <span
                                key={tag}
                                className="rounded-full border px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs"
                                dangerouslySetInnerHTML={{
                                  __html: `#${highlighter.highlight(tag, debouncedSearch).HTML}`
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {searchHit.document.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="size-3 text-red-600" />
                            <span
                              className="text-[11px] font-medium text-amber-800 dark:text-amber-400"
                              dangerouslySetInnerHTML={{
                                __html: highlighter.highlight(
                                  searchHit.document.location, debouncedSearch
                                ).HTML
                              }}
                            >
                            </span>
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