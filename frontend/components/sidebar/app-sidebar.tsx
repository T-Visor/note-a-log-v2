import { Sidebar } from "@/components/ui/sidebar";
import { SidebarHeaderNotes } from "./header";
import { SidebarNotesList } from "./notes-list";
import { SidebarFooterAccountInfo } from "./footer";
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
      <SidebarHeaderNotes
        clearCurrentNote={clearCurrentNote}
      />
      <SidebarNotesList
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