import { Sidebar } from "@/components/ui/sidebar";
import { NoteSidebarHeader } from "./sidebar-header";
import { SidebarContentNotes } from "./sidebar-content-notes";
import { SidebarFooterAccountInfo } from "./sidebar-footer";
import useNotesStore from "@/stores/useNotesStore";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Theme } from "@/types";

export const AppSidebar = () => {
  const {
    currentNote,
    setCurrentNoteUsingID,
    clearCurrentNote,
    deleteNote,
    sidebarNotes,
  } = useNotesStore();
  
  const { setTheme, resolvedTheme } = useTheme();
  const [menuSelectedTheme, setMenuSelectedTheme] = useState<Theme>(
    resolvedTheme === "dark" ? "dark" : "light"
  );
  const handleThemeChange = (theme: string) => {
    setMenuSelectedTheme(theme as Theme);
    setTheme(theme as Theme);
  };

  return (
    <Sidebar collapsible="icon">
      <NoteSidebarHeader
        clearCurrentNote={clearCurrentNote}
      />
      <SidebarContentNotes
        sidebarNotes={sidebarNotes}
        currentNote={currentNote}
        setCurrentNoteUsingID={setCurrentNoteUsingID}
        deleteNote={deleteNote}
      />
      <SidebarFooterAccountInfo
        menuSelectedTheme={menuSelectedTheme}
        handleThemeChange={handleThemeChange}
      />
    </Sidebar>
  );
};