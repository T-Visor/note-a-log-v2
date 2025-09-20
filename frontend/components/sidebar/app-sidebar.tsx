import { Sidebar } from "@/components/ui/sidebar";
import { NoteSidebarHeader } from "./sidebar-header";
import { SidebarNotes } from "./sidebar-notes";
import { SidebarFooterAccountInfo } from "./sidebar-footer";
import useNotesStore from "@/stores/useNotesStore";
import { useState } from "react";
import { useTheme } from "next-themes";
import { Theme } from "@/types";

export const AppSidebar = () => {
  const {
    currentNote,
    setCurrentNote,
    clearCurrentNote,
    deleteNote,
    notes,
  } = useNotesStore();

  const { setTheme, theme } = useTheme();
  const [menuSelectedTheme, setMenuSelectedTheme] = useState<Theme>(
    theme !== null ? theme as Theme : "system"
  );

  const handleThemeChange = (theme: string) => {
    setMenuSelectedTheme(theme as Theme);
    setTheme(theme as Theme);
  };

  return (
    <Sidebar>
      <NoteSidebarHeader
        clearCurrentNote={clearCurrentNote}
      />
      <SidebarNotes
        notes={notes}
        currentNote={currentNote}
        setCurrentNote={setCurrentNote}
        deleteNote={deleteNote}
      />
      <SidebarFooterAccountInfo
        menuSelectedTheme={menuSelectedTheme}
        handleThemeChange={handleThemeChange}
      />
    </Sidebar>
  );
};