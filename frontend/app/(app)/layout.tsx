import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import ThemeProvider from "@/components/theme-provider";
import ClientWrapperLayout from "@/components/client-wrapper-layout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";

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
  manifest: "/manifest.json"
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      themes={["light", "dark"]}
    >
      <SidebarProvider>
        <ClientWrapperLayout>
          {children}
        </ClientWrapperLayout>
      </SidebarProvider>
    </ThemeProvider>
    <Toaster />
  </>
);

export default RootLayout;