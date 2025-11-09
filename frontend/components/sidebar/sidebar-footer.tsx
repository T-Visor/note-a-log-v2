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
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);

  return (
    <SidebarFooter 
      className="
        dark:bg-gray-800 
        border-t 
        group-data-[collapsible=icon]:border-0 
        group-data-[collapsible=icon]:flex justify-center items-center
      "
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={dropdownMenuOpen} onOpenChange={setDropdownMenuOpen}>
            {/* User Icon Button */}
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

              {/* Button trigger for Settings Dialog */}
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(event) => {
                  // Close the dropdown and then open dialog
                  event.preventDefault();
                  setDropdownMenuOpen(false);
                  setDialogOpen(true);
                }}
              >
                <div
                  className="flex items-center gap-2.5"
                >
                  <Settings className="!size-4 !text-foreground" />
                  Settings
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialog lives outside the menu so it doesn't get closed when the menu does. */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent>
              <DialogTitle>
                Settings
              </DialogTitle>
              Hello
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};