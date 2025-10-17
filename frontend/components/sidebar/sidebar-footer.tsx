import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ChevronUp, User2 } from "lucide-react";
import { Theme } from "@/types";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarFooterAccountInfoProps {
  menuSelectedTheme: Theme;
  handleThemeChange: (theme: string) => void;
}

export const SidebarFooterAccountInfo = ({
  menuSelectedTheme,
  handleThemeChange
}: SidebarFooterAccountInfoProps) => {
  const { state, isMobile } = useSidebar();

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
              side={`${state === "collapsed" ? "right" : "top"}`}
              className="w-[--radix-popper-anchor-width]"
            >
              <DropdownMenuLabel className="font-bold">
                Theme
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
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
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
};