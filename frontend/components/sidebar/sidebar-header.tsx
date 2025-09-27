import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarHeader } from "@/components/ui/sidebar";
import { SquarePen, Search } from "lucide-react";
import NoteSearchDialog from "@/components/note/note-search-dialog";

export const NoteSidebarHeader = ({
  clearCurrentNote
}: { clearCurrentNote: () => void }) => (
  <SidebarHeader
    className="
      flex flex-col justify-center items-center gap-1
      dark:bg-gray-800
    "
  >
    <div className="w-full flex flex-row justify-end gap-1">
      <NoteSearchDialog
        button={
          (<Button
            className="bg-gray-100 dark:bg-gray-800"
            variant="ghost"
          >
            <Search
              className="
                size-5
                text-foreground
              "
            />
          </Button>)
        }
      />
      <Button
        variant="ghost"
        onClick={() => {
          clearCurrentNote();
        }}
      >
        <SquarePen className="size-5" />
      </Button>
    </div>
  </SidebarHeader>
);