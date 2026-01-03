import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import ThemeProvider from "@/components/theme-provider";
import ClientWrapperLayout from "@/components/client-wrapper-layout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Note-a-log",
  description: "Find your notes faster",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en">
    <body
      className={`
          min-h-svh w-full overflow-y-hidden
          dark:bg-gray-900
          antialiased ${geistSans.variable} ${geistMono.variable} 
        `}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        themes={["system", "light", "dark"]}
      >
        <SidebarProvider>
          <ClientWrapperLayout>
            {children}
          </ClientWrapperLayout>
        </SidebarProvider>
      </ThemeProvider>
      <Toaster />
    </body>
  </html>
);

export default RootLayout;