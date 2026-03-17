import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
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
  DropdownMenuPortal,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ChevronUp,
  User2,
  Settings,
  Palette,
  LogOut,
  GlobeX
} from "lucide-react";
import { Theme } from "@/types";
import { useSidebar } from "@/components/ui/sidebar";
import { useState, useRef } from "react";
import { AISettingsDialog } from "@/components/sidebar/profile/ai-settings-dialog";
//import { exportNotesSnapshot, importNotesSnapshot } from "@/lib/note-utils";
import useNotesStore from "@/stores/useNotesStore";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { DropdownMenuLabel } from "@radix-ui/react-dropdown-menu";

interface SidebarFooterAccountInfoProps {
  menuSelectedTheme: Theme;
  handleThemeChange: (theme: string) => void;
}

export const SidebarFooterAccountInfo = ({
  menuSelectedTheme,
  handleThemeChange
}: SidebarFooterAccountInfoProps) => {
  const { state, isMobile } = useSidebar();
  const [logOutDialogOpen, setLogOutDialogOpen] = useState(false);
  const [aiSettingsDialogOpen, setAISettingsDialogOpen] = useState(false);
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const router = useRouter();

  const { setCurrentNote, notes } = useNotesStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  /*const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importNotesSnapshot(file);
      setCurrentNote(null);
      toast("Notes imported successfully!");

      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
    catch (error) {
      toast.error("Failed to import notes: " + (error as Error).message);
    }
  };*/

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
                  {
                    session?.user.email 
                    ?? 
                    <div className="flex justify-center items-center gap-2">
                      <GlobeX className="!size-4" />
                      <span className="">Offline</span>
                    </div>
                  }
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
                <DropdownMenuLabel className="flex items-center justify-start text-sm text-muted-foreground py-1 px-3">{notes.length} notes</DropdownMenuLabel>
                <DropdownMenuSeparator />
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
                      {/*<DropdownMenuRadioItem value="system">
                        System
                      </DropdownMenuRadioItem>*/}
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
                  setAISettingsDialogOpen(true);
                }}
              >
                <div
                  className="flex items-center gap-2.5"
                >
                  <Settings className="!size-4 !text-foreground" />
                  Settings
                </div>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(event) => {
                  // Close the dropdown and then open dialog
                  event.preventDefault();
                  setDropdownMenuOpen(false);
                  setLogOutDialogOpen(true);
                }}
              >
                <div
                  className="flex justify-center items-center gap-2.5"
                >
                  <LogOut className="!size-4 !text-foreground" />
                  Logout
                </div>
              </DropdownMenuItem>

              {/* Button to export notes data
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={exportNotesSnapshot}
              >
                <div
                  className="flex items-center gap-2.5"
                >
                  <Upload className="!size-4 !text-foreground" />
                  Export
                </div>
              </DropdownMenuItem>*/}

              {/* Button for importing notes data
              <input
                ref={fileInputRef}
                id="importNotes"
                type="file"
                className="hidden"
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
                  Import
                </div>
              </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog 
            open={logOutDialogOpen} 
            onOpenChange={setLogOutDialogOpen}
          >
            <DialogContent 
              className="px-15 dark:bg-gray-950 dark:border-gray-950"
              showCloseButton={false}
            >
              <DialogHeader className="pb-3">
                <DialogTitle className="text-xl text-center">
                  Log out as {session?.user.email}?
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3">
                <Button
                  className="w-1/2 rounded-full hover:cursor-pointer border-1"
                  onClick={async () => {
                    await authClient.signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          router.push("/login");
                        }
                      }
                    });
                  }}
                >
                  Log Out
                </Button>
                <Button 
                  className="w-1/2 rounded-full hover:cursor-pointer border-1" 
                  variant="secondary"
                  onClick={() => {
                    setLogOutDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <AISettingsDialog
            dialogOpen={aiSettingsDialogOpen}
            setDialogOpen={setAISettingsDialogOpen}
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};