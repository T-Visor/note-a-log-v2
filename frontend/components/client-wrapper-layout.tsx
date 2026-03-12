"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Ellipsis, Trash, Link as CopyLink, Check, CalendarPlus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import NoteTagManagerDialog from "@/components/note/note-tag-manager-dialog";
import useNotesStore from "@/stores/useNotesStore";
import { useState, useEffect } from "react";
import { toast } from "sonner"
import CalendarDialog from "@/components/note/calendar/calendar-dialog";
import {
  PDFExporter,
  pdfDefaultSchemaMappings,
} from "@blocknote/xl-pdf-exporter";
import * as ReactPDF from "@react-pdf/renderer";
import { BlockNoteEditor } from "@blocknote/core";

const ClientWrapperLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  const { state, isMobile } = useSidebar();
  const showTrigger = state === "expanded" || isMobile;
  const { currentNote, deleteNote, updateNote } = useNotesStore();
  const [dateStamp, setDateStamp] = useState<"Updated" | "Created">("Updated");
  const [tags, setTags] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  const exportNoteContentsToPDF = async () => {
    if (!currentNote) 
      return;

    try {
      // Create an "in-memory" editor instance just for exporting notes
      // to PDF.
      const editor = BlockNoteEditor.create({
        initialContent: currentNote.editorContent,
      });

      // Get the current date timestamp for the PDF name
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-11
      const day = String(now.getDate()).padStart(2, "0");
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      const dateTimeStamp = `${month}${day}${year}_${hours}${minutes}${seconds}`;

      // Create the exporter and PDF document
      const pdfExporter = new PDFExporter(editor.schema, pdfDefaultSchemaMappings);
      const pdfDocument = await pdfExporter.toReactPDFDocument(editor.document);

      // Convert to Blob and Download
      const blob = await ReactPDF.pdf(pdfDocument).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentNote.title || "Note"}_${dateTimeStamp}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } 
    catch (error) {
      console.error("Export failed", error);
      toast.error("Failed to generate PDF");
    }
  };

  // 2. ADD THIS: Sync local state when the selected note changes
  useEffect(() => {
    if (currentNote) {
      setTags(currentNote.tags || []);
      setLocation(currentNote.location || "")
    }
  }, [currentNote?.id, currentNote?.tags, currentNote?.location]);

  const handleTagsChange = (newTags: string[]) => {
    // 1. Optimistically update local UI immediately
    setTags(newTags);

    // 2. Update the store/database
    // ONLY send the fields that changed. 
    if (currentNote?.id) {
      updateNote(currentNote.id, {
        tags: newTags,
        updatedAt: new Date().toISOString()
        // REMOVED: title: currentNote.title
        // REMOVED: content: currentNote.content
      });
    }
  };

  const handleLocationChange = (location: string) => {
    // Optimistically update local UI
    setLocation(location);

    // Update the store/database
    if (currentNote?.id) {
      updateNote(currentNote.id, {
        location: location,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const formatFriendlyDateTime = (isoString: string) => {
    if (!isoString) return "";

    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Invalid Date";

    // Use undefined for the locale to use the browser's default
    // Use the specific options to ensure local conversion
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      // This is the key: it forces the browser to use its own timezone
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    return new Intl.DateTimeFormat("en-US", options).format(date).replace(',', '');
  };

  const copyLinkToClipboard = (id: string) => {
    const url = `${window.location.origin}/note/?id=${id}`;
    navigator.clipboard.writeText(url);
  };

  const handleCopyButtonClick = () => {
    copyLinkToClipboard(currentNote?.id!);
    setLinkCopied(true);
    setTimeout(() => {
      setLinkCopied(false);
    }, 2000);
  };

  return (
    <>
      <AppSidebar />
      <main className="w-full flex flex-col items-center justify-between">
        <header
          className="
            flex w-full justify-between items-center
            pt-2 pb-2 px-2 
            bg-gray-50 sm:bg-white
            dark:bg-gray-800 sm:dark:bg-gray-900
          "
        >
          <SidebarTrigger
            className={`h-auto w-auto p-2 hover:cursor-pointer ${!showTrigger ? "invisible pointer-events-none" : ""
              }`}
            aria-hidden={!showTrigger}
            tabIndex={showTrigger ? 0 : -1}
          />
          {currentNote && (<div className="flex items-center gap-1.5">
            <NoteTagManagerDialog
              key={currentNote.id}
              noteID={currentNote.id}
              title={currentNote.title}
              content={currentNote.content}
              tags={tags}
              location={location}
              handleLocationChange={handleLocationChange}
              handleTagsChange={handleTagsChange}
              isSaved={true}
            />
            <CalendarDialog />
            <DropdownMenu >
              <DropdownMenuTrigger asChild>
                <Button
                  className="p-2"
                  variant="ghost"
                >
                  <Ellipsis className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="bottom"
                className="dark:bg-gray-900"
              >
                <DropdownMenuLabel
                  className="hover:cursor-pointer py-3"
                  onClick={() => {
                    if (dateStamp === "Updated")
                      setDateStamp("Created");
                    else if (dateStamp === "Created")
                      setDateStamp("Updated");
                  }}
                >
                  <span className="text-sm text-muted-foreground">
                    {dateStamp === "Updated"
                      ? `Updated: ${formatFriendlyDateTime(currentNote?.updatedAt)}`
                      : `Created: ${formatFriendlyDateTime(currentNote?.createdAt)}`
                    }
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="flex justify-center items-center gap-2 hover:cursor-pointer py-2"
                  onClick={(event) => {
                    event.preventDefault();
                    handleCopyButtonClick();
                    toast("Link copied!");
                  }}
                >
                  {linkCopied
                    ?
                    <>
                      <Check className="!size-3.5" />
                      <span className="text-sm">
                        Copy Link
                      </span>
                    </>
                    :
                    <>
                      <CopyLink className="!size-3.5" />
                      <span className="text-sm">
                        Copy Link
                      </span>
                    </>
                  }
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex justify-center items-center gap-2 hover:cursor-pointer py-2"
                  onClick={async (event) => {
                    event.preventDefault();
                    await exportNoteContentsToPDF();
                  }}
                >
                  <Download className="!size-3.5"/>
                  <span className="text-sm">Export PDF</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex justify-center items-center gap-2 hover:cursor-pointer bg-red-600 dark:bg-red-800 mx-2 my-4 text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    deleteNote(currentNote.id);
                  }}
                >
                  <Trash className="size-3 text-white" />
                  <span className="text-sm">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>)}
        </header>
        {children}
      </main>
    </>
  );
};

export default ClientWrapperLayout;