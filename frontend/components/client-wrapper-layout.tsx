"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Ellipsis, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NoteTagManagerDialog from "@/components/note/note-tag-manager-dialog";
import useNotesStore from "@/stores/useNotesStore";
import { useState, useEffect } from "react"; // Import useEffect

const ClientWrapperLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { state, isMobile } = useSidebar();
  const showTrigger = state === "expanded" || isMobile;
  const { currentNote, deleteNote, updateNote } = useNotesStore();

  // 1. Initialize state
  const [tags, setTags] = useState<string[]>([]);

  // 2. ADD THIS: Sync local state when the selected note changes
  useEffect(() => {
    if (currentNote) {
      setTags(currentNote.tags || []);
    }
  }, [currentNote?.id, currentNote?.tags]);

  const handleTagsChange = (newTags: string[]) => {
    // 1. Optimistically update local UI immediately
    setTags(newTags);

    // 2. Update the store/database
    // ONLY send the fields that changed. 
    if (currentNote?.id) {
      updateNote(currentNote.id, {
        tags: newTags,
        updatedAt: new Date().toISOString()
        // REMOVED: title: currentNote.title
        // REMOVED: content: currentNote.content
      });
    }
  };

  return (
    <>
      <AppSidebar />
      <main className="w-full flex flex-col items-center justify-between">
        <header
          className="
            flex w-full justify-between items-center
            pt-2 pb-2 px-2 
            bg-gray-50 sm:bg-white
            dark:bg-gray-800 sm:dark:bg-gray-900
          "
        >
          <SidebarTrigger
            className={`h-auto w-auto p-2 hover:cursor-pointer ${!showTrigger ? "invisible pointer-events-none" : ""
              }`}
            aria-hidden={!showTrigger}
            tabIndex={showTrigger ? 0 : -1}
          />
          {currentNote && (<div className="flex items-center gap-1">
            <NoteTagManagerDialog
              noteID={currentNote.id}
              title={currentNote.title}
              content={currentNote.content}
              tags={tags}
              handleTagsChange={handleTagsChange}
              isSaved={true}
            />
            <DropdownMenu >
              <DropdownMenuTrigger asChild>
                <Button
                  className="p-2"
                  variant="ghost"
                >
                  <Ellipsis className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                className="dark:bg-gray-900"
              >
                <DropdownMenuItem
                  className="flex justify-center items-center gap-2 hover:cursor-pointer"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    deleteNote(currentNote.id);
                  }}
                >
                  <span>Delete</span>
                  <Trash className="size-3" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>)}
        </header>
        {children}
      </main>
    </>
  );
};

export default ClientWrapperLayout;