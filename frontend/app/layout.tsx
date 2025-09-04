import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import ClientWrapperLayout from "@/components/client-wrapper-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Note-a-log V2",
  description: "Organizing your notes with AI",
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => (
  <html lang="en" className="">
    <body
      className={`
          h-screen max-h-screen overflow-y-hidden
          ${geistSans.variable} ${geistMono.variable} antialiased dark:bg-gray-900
        `}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <ClientWrapperLayout>
          {children}
        </ClientWrapperLayout>
      </ThemeProvider>
    </body>
  </html>
);

export default RootLayout;