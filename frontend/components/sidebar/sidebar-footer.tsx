import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ChevronUp,
  User2,
  Settings,
  Palette,
  Download,
  Upload
} from "lucide-react";
import { Theme } from "@/types";
import { useSidebar } from "@/components/ui/sidebar";
import { useState, useRef } from "react";
import { AISettingsDialog } from "@/components/sidebar/profile/ai-settings-dialog";
import { exportNotesSnapshot, importNotesSnapshot } from "@/lib/note-utils";

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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importNotesSnapshot(file);
      alert("Notes imported successfully!");

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    catch (error) {
      alert("Failed to import notes: " + (error as Error).message);
    }
  };

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
              className="w-[--radix-popper-anchor-width] dark:bg-gray-950"
            >
              {/* Theme Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2.5">
                  <Palette className="!size-4" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="dark:bg-gray-950">
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

              {/* Button to export notes data */}
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={exportNotesSnapshot}
              >
                <div
                  className="flex items-center gap-2.5"
                >
                  <Upload className="!size-4 !text-foreground" />
                  Export Notes
                </div>
              </DropdownMenuItem>

              {/* Button for importing notes data */}
              <input
                ref={fileInputRef}
                id="importNotes"
                type="file"
                className="sr-only"
                accept=".json"
                onChange={handleImport}
              />
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(event) => {
                  event.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                <div
                  className="flex items-center gap-2.5"
                >
                  <Download className="!size-4 !text-foreground" />
                  Import Notes
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AISettingsDialog
            dialogOpen={dialogOpen}
            setDialogOpen={setDialogOpen}
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};