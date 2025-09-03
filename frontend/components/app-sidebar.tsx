import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NotebookPen, FolderPlus, Search, Sparkles, ChevronUp, User2 } from "lucide-react";

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader
        className="
          flex flex-col justify-center items-center gap-3
          border-b
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
            "/>
            <Input
              type="text"
              placeholder="Search..."
              className="
              pl-10 
              border-1 bg-gray-50 dark:border-gray-800 
              shadow-none
            "
            />
          </div>
          <Button variant="ghost">
            <FolderPlus className="size-5" />
          </Button>
          <Button variant="ghost">
            <NotebookPen className="size-5" />
          </Button>
        </div>
        <div>
          <Button variant="ghost" className="text-sm">
            <Sparkles />
            Organize with AI
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent className="dark:bg-gray-800">
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter className="dark:bg-gray-800 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 /> Username
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                className="w-[--radix-popper-anchor-width]"
              >
                <DropdownMenuItem>
                  <span>Account</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}