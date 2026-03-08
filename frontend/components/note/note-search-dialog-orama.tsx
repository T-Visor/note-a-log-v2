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

const DEBOUNCE_DELAY_IN_MILLISECONDS = 400;
const CHARACTER_CONTEXT_SIZE = 200;
const SEARCH_RESULTS_LIMIT = 20;

const NoteSearchDialog = ({
  button
}: { button: ReactElement<HTMLButtonElement> }) => {
  const { setCurrentNote, setCurrentNoteUsingID, notes } = useNotesStore();
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

  // Extract a subset of the notes data,
  // the 'id' field is also extracted so we can set the current Note via
  // existing id value.
  const searchableNotes = notes.map(
    ({ id, title, content, tags, location }: Note) => ({
      id,
      title,
      content,
      tags,
      location
    })
  );

  // FOR TESTING LOCALLY -- TODO: this will need to move to the state store for scalibility.
  // right now the index is being rebuilt on every launch of the notes app.
  insertMultiple(searchableNotesIndex, searchableNotes);

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

  searchHits.map((hit: any) => console.log(hit.document));

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
                {searchHits.map((searchHit: any) => {

                  // Only show tags in the results if they contain the keyword searched.
                  const tagsContainingSearchTerm = searchHit.document.tags.filter((tag: string) => (
                    tag.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
                  ));

                  return (
                    <CommandItem
                      key={searchHit.id}
                      /**
                        * CRITICAL: The 'value' prop must be explicitly set to the ID. 
                        * shadcn/cmdk uses this for internal selection state. 
                        * If removed, it defaults to the inner text, breaking the auto-highlight.
                        */
                      value={searchHit.id}
                      className="grid grid-cols-1 mx-2"
                      onSelect={async () => {
                        await setCurrentNoteUsingID(searchHit.document.id);
                        setOpen(false);
                      }}
                    >
                      <div className="grid grid-cols-1 gap-1">
                        <span className="line-clamp-1">
                          <strong>
                            {searchHit.document.title}
                          </strong>
                        </span>
                        <span className="line-clamp-2">
                          {searchHit.document.content.slice(0, CHARACTER_CONTEXT_SIZE)}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {tagsContainingSearchTerm.map((tag: any) => (
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
                        {searchHit.document.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md">
                              <MapPin className="size-3 text-red-600 dark:text-red-500" />
                              <span className="text-[11px] font-medium text-amber-800 dark:text-amber-400">
                                {searchHit.document.location}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  )
                }
                )}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
};

export default NoteSearchDialog;