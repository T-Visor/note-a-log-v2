import { Button } from "@/components/ui/button";
import { SidebarHeader } from "@/components/ui/sidebar";
import NoteSearchDialog from "@/components/note/note-search-dialog";
import { SquarePen, Search } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export const NoteSidebarHeader = ({
  clearCurrentNote
}: { clearCurrentNote: () => void }) => {
  const { state, isMobile } = useSidebar();

  return (
    <SidebarHeader
      className="
      flex flex-col justify-center items-center gap-1
      dark:bg-gray-800
    "
    >
      <div
        className="
          w-full 
          flex flex-row justify-end items-center gap-1 
          group-data-[collapsible=icon]:flex-col-reverse
          overflow-hidden
        "
      >
        {state === "collapsed" && !isMobile ? (
          <NoteSearchDialog
            button={<Button
              variant="ghost"
              className="hover:cursor-pointer"
              onClick={() => {
                clearCurrentNote();
              }}
            >
              <Search className="size-5" />
            </Button>}
          />
        ) : (
          <div className="flex-1">
            <NoteSearchDialog
              button={(
                <Button
                  className="
                    relative w-full 
                    hover:cursor-pointer 
                    bg-gray-100 border-gray-200 border-1
                    dark:bg-[#343C4D] dark:border-gray-800 
                    shadow-none
                  "
                  variant="outline"
                >
                  <Search
                    className="
                      absolute left-2 top-1/2 -translate-y-1/2
                      size-4
                      text-foreground
                    "
                  />
                  <span className="text-sm text-muted-foreground">
                    Search Notes...
                  </span>
                </Button>
              )}
            />
          </div>
        )}
        <Button
          variant="ghost"
          className="hover:cursor-pointer"
          onClick={() => {
            clearCurrentNote();
          }}
        >
          <SquarePen className="size-5" />
        </Button>
      </div>
    </SidebarHeader>
  )
};