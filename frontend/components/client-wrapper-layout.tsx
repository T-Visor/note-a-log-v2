"use client"

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";

const ClientWrapperLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { state, isMobile } = useSidebar();
  const showTrigger = state === "expanded" || isMobile;

  return (
    <>
      <AppSidebar />
      <main className="w-full flex flex-col items-center justify-between">
        <header
          className="
            flex w-full justify-between items-center
            pt-2 pb-1 px-2 
            bg-gray-50 sm:bg-white
            dark:bg-gray-800 sm:dark:bg-gray-900
          "
        >
          <SidebarTrigger
            className={`h-auto w-auto p-2 hover:cursor-pointer ${
              !showTrigger ? "invisible pointer-events-none" : ""
            }`}
            aria-hidden={!showTrigger}
            tabIndex={showTrigger ? 0 : -1}
          />
        </header>
        {children}
      </main>
    </>
  );
};

export default ClientWrapperLayout;
