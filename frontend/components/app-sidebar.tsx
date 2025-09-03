import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { NotebookPen, FolderPlus, Search } from "lucide-react";

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader 
        className="
          flex flex-row justify-end gap-1
          dark:bg-gray-800
        "
      >
        <Button variant="ghost">
          <Search className="size-5" />
        </Button>
        <Button variant="ghost">
          <FolderPlus className="size-5" />
        </Button>
        <Button variant="ghost">
          <NotebookPen className="size-5" />
        </Button>
      </SidebarHeader>
      <SidebarContent className="dark:bg-gray-800">
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="dark:bg-gray-800" />
    </Sidebar>
  )
}