import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronUp, User2, Settings, Palette } from "lucide-react";
import { Theme } from "@/types";
import { useSidebar } from "@/components/ui/sidebar";
import { useState } from "react";

interface SidebarFooterAccountInfoProps {
  menuSelectedTheme: Theme;
  handleThemeChange: (theme: string) => void;
}

export const SidebarFooterAccountInfo = ({
  menuSelectedTheme,
  handleThemeChange
}: SidebarFooterAccountInfoProps) => {
  const { state, isMobile } = useSidebar();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SidebarFooter className="dark:bg-gray-800 border-t group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:flex justify-center items-center">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {state === "collapsed" && !isMobile ? (
                <SidebarMenuButton className="flex justify-center items-center">
                  <User2 className="!size-5" />
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton>
                  <User2 /> Profile
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={state === "collapsed" ? "right" : "top"}
              className="w-[--radix-popper-anchor-width]"
            >
              {/* Theme Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2.5">
                  <Palette className="!size-4" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={menuSelectedTheme}
                      onValueChange={handleThemeChange}
                    >
                      <DropdownMenuRadioItem value="system">
                        System
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="light">
                        Light
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenu>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={() => {
                    setDialogOpen(true);
                  }}
                >
                  <div
                    className="flex items-center gap-2.5"
                  >
                    <Settings className="!size-4" />
                    Settings
                  </div>
                </DropdownMenuItem>
              </DropdownMenu>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                  Hello
                </DialogContent>
              </Dialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};