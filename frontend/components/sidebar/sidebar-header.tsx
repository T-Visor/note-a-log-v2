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
    <div className="w-full flex flex-row justify-end gap-1">
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Notes" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Notes">Notes</SelectItem>
          <SelectItem value="Tags">Tags</SelectItem>
          <SelectItem value="Folders">Folders</SelectItem>
        </SelectContent>
      </Select>
      <NoteSearchDialog
        button={
          (<Button
            className="bg-gray-50 dark:bg-gray-800"
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