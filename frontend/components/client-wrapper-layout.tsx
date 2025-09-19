"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const ClientWrapperLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <SidebarProvider>
      <AppSidebar />
      <main
        className="
          w-full
          flex flex-col items-center justify-between
        "
      >
        <header
          className="
            flex w-full justify-between items-center
            pt-2 pb-1 px-2
          "
        >
          <SidebarTrigger className="h-auto w-auto p-2" />
        </header>
        {children}
      </main>
    </SidebarProvider>
  );
};

export default ClientWrapperLayout;