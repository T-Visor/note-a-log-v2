"use client";

import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Ellipsis, Trash, Link as CopyLink, Check, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import NoteTagManagerDialog from "@/components/note/note-tag-manager-dialog";
import useNotesStore from "@/stores/useNotesStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import CalendarDialog from "@/components/note/calendar/calendar-dialog";
import { Packer } from "docx";
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);


  const exportNoteContentsToPDF = async () => {
    if (!currentNote)
      return;

    const { PDFExporter, pdfDefaultSchemaMappings } = await import("@blocknote/xl-pdf-exporter");

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

  const exportNoteContentsToDocx = async () => {
    if (!currentNote)
      return;

    const { DOCXExporter, docxDefaultSchemaMappings } = await import("@blocknote/xl-docx-exporter");

    // Create an "in-memory" editor instance just for exporting notes
    // to DOCX.
    const editor = BlockNoteEditor.create({
      initialContent: currentNote.editorContent,
    });

    const exporter = new DOCXExporter(editor.schema, docxDefaultSchemaMappings);
    const blob = await exporter.toBlob(editor.document);

    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${currentNote.title || "Note"}.docx`;
    document.body.appendChild(link);
    link.dispatchEvent(
      new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      }),
    );
    link.remove();
    window.URL.revokeObjectURL(link.href);
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
      <main className="h-screen overflow-hidden w-full flex flex-col items-center justify-between">
        <header
          className="
            sticky top-0 z-10
            flex w-full justify-between items-center
            pt-2 pb-2 px-2 
            bg-gray-50 sm:bg-white
            dark:bg-gray-800 sm:dark:bg-gray-900
          "
        >
          <SidebarTrigger
            className={`[&_svg]:size-4.5 h-9 w-auto p-2 hover:cursor-pointer ${!showTrigger ? "invisible pointer-events-none" : ""
              }`}
            aria-hidden={!showTrigger}
            tabIndex={showTrigger ? 0 : -1}
          />
          {currentNote && (<div className="flex items-center gap-1.5">
            <CalendarDialog />
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
            <DropdownMenu >
              <DropdownMenuTrigger asChild>
                <Button
                  className="p-2"
                  variant="ghost"
                >
                  <Ellipsis className="!size-4.5" />
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
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="flex items-center gap-2">
                  <FileUp className="!size-3.5 text-muted-foreground" />
                  <span>Export As... </span>
                </DropdownMenuLabel>

                <DropdownMenuItem
                  className="flex justify-center items-center gap-2 hover:cursor-pointer py-2"
                  onClick={async (event) => {
                    event.preventDefault();
                    await exportNoteContentsToPDF();
                  }}
                >
                  <span className="text-sm">PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex justify-center items-center gap-2 hover:cursor-pointer py-2"
                  onClick={async (event) => {
                    event.preventDefault();
                    await exportNoteContentsToDocx();
                  }}
                >
                  <span className="text-sm">DOCX</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="flex justify-center items-center gap-2 hover:cursor-pointer bg-red-600 dark:bg-red-800 mx-2 my-4 text-white"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    //deleteNote(currentNote.id);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash className="size-3 text-white" />
                  <span className="text-sm">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <DialogContent
                className="px-5 dark:bg-gray-950 dark:border-gray-950 min-w-fit"
                showCloseButton={false}
              >
                <DialogHeader className="pb-3">
                  <DialogTitle className="text-xl text-center">
                    Confirm Delete
                  </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col justify-center items-center gap-3">
                  <Button
                    variant="destructive"
                    className="w-1/3 rounded-full hover:cursor-pointer border-1 bg-red-600 dark:bg-red-800"
                    onClick={async () => {
                      await deleteNote(currentNote.id);
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Delete
                  </Button>
                  <Button
                    className="w-1/3 rounded-full hover:cursor-pointer border-1"
                    variant="secondary"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>)}
        </header>
        <div className="w-full flex-1 min-h-0 overflow-y-auto scrollbar-chrome-thin">
          {children}
        </div>
      </main>
    </>
  );
};

export default ClientWrapperLayout;