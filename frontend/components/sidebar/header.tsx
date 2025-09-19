import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarHeader } from "@/components/ui/sidebar";
import { SquarePen, Search } from "lucide-react";

interface SidebarHeaderNotesProps {
  clearCurrentNote: () => void;
}

export const SidebarHeaderNotes = ({
  clearCurrentNote
}: SidebarHeaderNotesProps) => (
  <SidebarHeader
    className="
      flex flex-col justify-center items-center gap-3
      dark:bg-gray-800
    "
  >
    <div className="flex flex-row justify-end gap-1">
      <div className="relative w-full">
        <Search
          className="
            absolute left-3 top-1/2 -translate-y-1/2 
            h-4 w-4 
            text-foreground
          "
        />
        <Input
          type="text"
          placeholder="Search..."
          className="
            pl-10 
            border-1 bg-gray-100 dark:border-gray-800 
            shadow-none
          "
        />
      </div>
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