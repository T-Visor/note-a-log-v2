"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Ellipsis, Trash, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import useNotesStore from "@/stores/useNotesStore";

const ClientWrapperLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { state, isMobile } = useSidebar();
  const showTrigger = state === "expanded" || isMobile;
  const { currentNote, clearCurrentNote, deleteNote } = useNotesStore();

  return (
    <>
      <AppSidebar />
      <main className="w-full flex flex-col items-center justify-between">
        <header
          className="
            flex w-full justify-between items-center
            pt-2 pb-1 px-2 
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
            <Button
              className="p-2 cursor-pointer"
              variant="ghost"
            >
              <Hash className="size-5" />
            </Button>
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
