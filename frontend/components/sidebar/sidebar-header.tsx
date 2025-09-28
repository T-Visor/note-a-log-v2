import { Button } from "@/components/ui/button";
import { SidebarHeader } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import NoteSearchDialog from "@/components/note/note-search-dialog";
import { SquarePen, Search } from "lucide-react";

export const NoteSidebarHeader = ({
  clearCurrentNote
}: { clearCurrentNote: () => void }) => (
  <SidebarHeader
    className="
      flex flex-col justify-center items-center gap-1
      dark:bg-gray-800
    "
  >
    <div 
      className="
        w-full 
        flex flex-row justify-end gap-1 
      "
    >
      <Select>
        <SelectTrigger className="w-full hover:cursor-pointer !shadow-none">
          <SelectValue placeholder="Notes" />
        </SelectTrigger>
        <SelectContent className="">
          <SelectItem value="Notes" className="hover:cursor-pointer">Notes</SelectItem>
          <SelectItem value="Tags" className="hover:cursor-pointer">Tags</SelectItem>
          <SelectItem value="Folders"className="hover:cursor-pointer">Folders</SelectItem>
        </SelectContent>
      </Select>
      <NoteSearchDialog
        button={
          (<Button
            className="hover:cursor-pointer bg-gray-50 dark:bg-gray-800"
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
        className="hover:cursor-pointer"
        onClick={() => {
          clearCurrentNote();
        }}
      >
        <SquarePen className="size-5" />
      </Button>
    </div>
  </SidebarHeader>
);