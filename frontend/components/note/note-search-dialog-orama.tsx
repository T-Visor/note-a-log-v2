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
import { Highlight } from "@orama/highlight";
import { search as searchOrama } from "@orama/orama";

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;
const CHARACTER_CONTEXT_SIZE = 100; // Show 100 chars around the match
const SEARCH_RESULTS_LIMIT = 20;

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEBOUNCE_DELAY_IN_MILLISECONDS);
    return () => clearTimeout(timeout);
  }, [search]);

  const searchHits = useMemo(() => {
    if (!debouncedSearch || !oramaIndex) 
      return [];
    
    // Perform the search
    const results: any = searchOrama(oramaIndex, {
      term: debouncedSearch,
      limit: SEARCH_RESULTS_LIMIT,
    });

    return results.hits || [];
  }, [debouncedSearch, oramaIndex]);

  useEffect(() => {
    if (searchHits.length > 0)
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
                {searchHits.map((searchHit: any) => {
                  const searchTerm = debouncedSearch;
                  const content = searchHit.document.content || "";
                  
                  // Get the highlighted content area
                  const highlightedResult = highlighter.highlight(content, searchTerm);
                  
                  // Extract a snippet if a match exists
                  let displayContent = highlightedResult.HTML;
                  
                  if (highlightedResult.positions.length > 0) {
                    const firstMatch = highlightedResult.positions[0];
                    const start = Math.max(0, firstMatch.start - CHARACTER_CONTEXT_SIZE / 2);
                    const end = Math.min(content.length, firstMatch.start + CHARACTER_CONTEXT_SIZE / 2);
                    
                    // Re-highlight just the windowed area to keep HTML clean
                    const snippet = content.substring(start, end);
                    displayContent = (start > 0 ? "..." : "") + 
                                     highlighter.highlight(snippet, searchTerm).HTML + 
                                     (end < content.length ? "..." : "");
                  }

                  return (
                    <CommandItem
                      key={searchHit.id}
                      value={searchHit.id.toLowerCase()}
                      className="grid grid-cols-1 mx-2 cursor-pointer py-3 border-b last:border-0 border-gray-100 dark:border-gray-900"
                      onSelect={async () => {
                        await setCurrentNoteUsingID(searchHit.document.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm">
                          <span dangerouslySetInnerHTML={{ 
                            __html: highlighter.highlight(searchHit.document.title || "Untitled", searchTerm).HTML 
                          }} />
                        </span>
                        
                        {/* Highlighted Content Snippet */}
                        <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          <span dangerouslySetInnerHTML={{ __html: displayContent }} />
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-3 mt-1">
                          {searchHit.document.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3 text-red-500" />
                              <span className="text-[10px] text-amber-700 dark:text-amber-400" 
                                dangerouslySetInnerHTML={{ __html: highlighter.highlight(searchHit.document.location, searchTerm).HTML }}
                              />
                            </div>
                          )}
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