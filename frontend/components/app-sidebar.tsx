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
import { SquarePen, FolderPlus, Search, Sparkles, ChevronUp, User2, Ellipsis, Trash } from "lucide-react";
import useNotesStore from "@/stores/useNotesStore";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";

export const AppSidebar = () => {
  const {
    currentNote,
    setCurrentNote,
    clearCurrentNote,
    notes,
  } = useNotesStore();

  return (
    <Sidebar>
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
          {/*<Button variant="ghost">
            <FolderPlus className="size-5" />
          </Button>*/}
          <Button
            variant="ghost"
            onClick={() => {
              clearCurrentNote();
            }}
          >
            <SquarePen className="size-5" />
          </Button>
        </div>
        {/*<div>
          <Button variant="ghost" className="text-sm">
            <Sparkles />
            Organize with AI
          </Button>
        </div>*/}
      </SidebarHeader>
      <SidebarContent className="dark:bg-gray-800">
        <SidebarGroup />
        <SidebarGroupContent className="py-1 overflow-auto grid grid-cols-1 gap-3">
          <LayoutGroup>
            <AnimatePresence>
              {[...notes].sort(
                (left, right) => +new Date(right.updatedAt) - +new Date(left.updatedAt)
              ).map((note) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  key={note.id}
                  onClick={() => setCurrentNote(note)}
                  className={`
                    relative group/note
                    ${note?.id === currentNote?.id ? "bg-gray-200 dark:bg-gray-700" : ""}
                    h-20
                    flex flex-col justify-start gap-3
                    py-4 px-3 mx-2
                    rounded-sm
                    hover:bg-gray-200 dark:hover:bg-gray-700
                  `}
                >
                  <div
                    className="
                    truncate text-ellipsis
                    text-md font-bold
                  "
                  >
                    {note.title}
                  </div>
                  <div
                    className="
                      truncate text-ellipsis
                      text-xs text-gray-500 dark:text-gray-400
                    "
                  >
                    {note.content}
                  </div>
                  <DropdownMenu >
                    <DropdownMenuTrigger asChild>
                      <Button
                        key={note.id}
                        className="
                          absolute 
                          flex opacity-0 group-hover/note:opacity-100
                          right-0 top-1/2 -translate-y-1/2
                          hover:bg-transparent dark:hover:bg-transparent
                        "
                        variant="ghost"
                      >
                        <Ellipsis className="size-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      side="bottom"
                      className="dark:bg-gray-900"
                    >
                      <DropdownMenuItem>
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              ))}
            </AnimatePresence>
          </LayoutGroup>
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
  );
};