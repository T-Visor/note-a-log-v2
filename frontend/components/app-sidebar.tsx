import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SquarePen, FolderPlus, Search, Sparkles, ChevronUp, User2 } from "lucide-react";

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
            <SquarePen className="size-5" />
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
          <SidebarGroupContent className="py-1 overflow-auto grid grid-cols-1 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
            <div 
              className="
                h-20
                flex flex-col justify-start gap-3
                py-4 px-3 mx-2
                rounded-sm
                hover:bg-gray-200 dark:hover:bg-gray-700
              "
            >
              <div className="text-md font-bold">Title</div>
              <div 
                className="
                  truncate text-ellipsis
                  text-xs text-gray-500 dark:text-gray-400
                "
              >
                This is some really long content that I want to see if it can be rendered
                in such a way that a lot of stuff can work out lorem ipsum ish.
              </div>
            </div>
          ))}
          </SidebarGroupContent>
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