"use client";

import { useState, useEffect, useMemo, ReactElement } from "react";
import { MapPin } from "lucide-react";
import DOMPurify from "dompurify";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import useNotesStore, { 
  POUCHDB_QUICK_SEARCH_FIELDS, 
  LOCAL_POUCH_CLIENT as noteSearcher 
} from "@/stores/useNotesStore";
import { Highlight } from "@orama/highlight";
import { search as searchOrama } from "@orama/orama";

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;
const CHARACTER_CONTEXT_SIZE = 150; // Show 100 chars around the match
const SEARCH_RESULTS_LIMIT = 20;

const highlighter = new Highlight({
  HTMLTag: "mark",
  CSSClass: "bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 rounded-sm px-0.5",
});

const NoteSearchDialog = ({
  button
}: { button: ReactElement<HTMLButtonElement> }) => {
  const { setCurrentNoteUsingID } = useNotesStore();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedNoteID, setSelectedNoteID] = useState("");
  const [searchHits, setSearchHits] = useState<any[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, DEBOUNCE_DELAY_IN_MILLISECONDS);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!debouncedSearch || !noteSearcher) {
      setSearchHits([]);
      return;
    }

    // Guards against a race condition if a query changes while an existing search is still running,
    // the older search can't overwrite the newer results when it finishes.
    let cancelled = false;

    (async () => {
      try {
        const results = await noteSearcher.search({
          query: debouncedSearch.trim(),
          fields: POUCHDB_QUICK_SEARCH_FIELDS,
          highlighting: true,
          include_docs: true,
          limit: SEARCH_RESULTS_LIMIT,
          //mm: "0%", // pure 'OR' search
        });
        if (!cancelled)
          setSearchHits(results.rows);
      }
      catch (error) {
        console.error(error);
        if (!cancelled)
          setSearchHits([]);
      }
    })();

    return () => {
      cancelled = true;
    }
  }, [debouncedSearch, noteSearcher]);

  useEffect(() => {
    if (searchHits.length > 0) {
      setSelectedNoteID(searchHits[0].id.toLowerCase());
    }
    else
      setSelectedNoteID("");
  }, [searchHits]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{button}</DialogTrigger>
      <DialogContent className="p-0 dark:border-gray-950 sm:!max-w-xl" showCloseButton={false}>
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
          <CommandList className="!max-h-100">
            {!debouncedSearch ? (
              <CommandEmpty></CommandEmpty>
            ) : searchHits.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {searchHits.map((searchHit: any) => {
                  const title = searchHit.highlighting?.title ?? searchHit.doc.title;
                  const content = searchHit.highlighting?.content ?? searchHit.doc.content.slice(0, CHARACTER_CONTEXT_SIZE);
                  const location = searchHit.highlighting?.location ?? searchHit.doc.location;

                  /* 
                   For tags, extract only the matching terms if any were found. 
                  */
                  // Even though tags are an array field, the match comes back as a single string with
                  // "<strong> </strong>"" wrapped around each matching term. 
                  //
                  // Then use a regex to extract each matching tag into an array.
                  const tags: string = searchHit.highlighting?.tags ?? "";
                  const uniqueMatchingTags: string[] = [...new Set(
                    tags.matchAll(/<strong>([\s\S]*?)<\/strong>/gi).map(
                      (match) => match[1]
                    )
                  )];

                  return (
                    <CommandItem
                      key={searchHit.id}
                      value={searchHit.id.toLowerCase()}
                      className="grid grid-cols-1 mx-2 cursor-pointer py-3 border-b last:border-0 border-gray-100 dark:border-gray-900"
                      onSelect={async () => {
                        await setCurrentNoteUsingID(searchHit.doc.id);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-col gap-1">
                        {/* Highlighted Title snippet */}
                        <span 
                          className="
                            font-bold text-sm 
                            [&_strong]:bg-amber-200 [&_strong]:font-normal dark:[&_strong]:bg-amber-900/50 [&_strong]:rounded-sm [&_strong]:px-0.5
                          "
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              title, { ALLOWED_TAGS: ["strong"] }
                            ),
                          }}
                        />

                        {/* Highlighted Content Snippet */}
                        <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          <span 
                            className="[&_strong]:bg-amber-200 [&_strong]:font-normal dark:[&_strong]:bg-amber-900/50 [&_strong]:rounded-sm [&_strong]:px-0.5"
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                content, { ALLOWED_TAGS: ["strong"] }
                              ),
                            }}
                          />
                        </div>

                        {/* Highlighted matching tags */}
                        {uniqueMatchingTags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {uniqueMatchingTags.map((tag: string) => (
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

                        {/* Location */}
                        {<div className="flex items-center gap-3 mt-1">
                          {location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="size-3 text-red-500" />
                              <span 
                                className="text-[10px] text-amber-700 dark:text-amber-400 [&_strong]:bg-amber-200 [&_strong]:font-normal dark:[&_strong]:bg-amber-900/50 [&_strong]:rounded-sm [&_strong]:px-0.5"
                                dangerouslySetInnerHTML={{
                                  __html: DOMPurify.sanitize(
                                    location, { ALLOWED_TAGS: ["strong"] }
                                  ),
                                }}                              
                              /> 
                            </div>
                          )}
                        </div>}
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