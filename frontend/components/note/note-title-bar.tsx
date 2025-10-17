import { KeyboardEvent, ChangeEvent } from "react";
import { Hash, Info, X, Plus, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { DialogDescription } from "@radix-ui/react-dialog";

interface NoteTitleBarProps {
  title: string;
  content: string;
  tags: string[];
  handleTitleChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleTagsChange: (noteTags: string[]) => void;
  handleEnterKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  isSaved: boolean;
}

const NoteTitleBar = ({
  title,
  content,
  tags,
  handleTitleChange,
  handleTagsChange,
  handleEnterKeyDown,
  isSaved
}: NoteTitleBarProps) => {

  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");

  return (
    <div className="relative w-full">
      <Textarea
        value={title}
        onChange={handleTitleChange}
        className="
          h-6 pr-12
          border-t-0 sm:border-t-1 
          rounded-t-none md:rounded-t-md
          border-b-0 rounded-b-none
          bg-gray-50 
          dark:bg-gray-800 dark:border-gray-800
          !text-2xl font-semibold
          resize-none shadow-none
        "
        placeholder="Title"
        onKeyDown={handleEnterKeyDown}
      />

      {/* Tag Button - appears when there's content */}
      {(title || content) && (
        <div
          className="
            absolute right-2 top-3/8 -translate-y-1/2
            p-3
            text-gray-800 dark:text-gray-200
            transition-opacity
          "
        >
          <Dialog
            open={dialogOpen}
            onOpenChange={(nextOpen) => {
              setDialogOpen(nextOpen);

              // when closing, reset tag state
              if (!nextOpen) {
                setIsAddingTag(false);
                setNewTag(""); // optional: clear input too
              }
            }}
          >
            <DialogTrigger asChild>
              <Button
                disabled={!isSaved}
                size="icon"
                className="rounded-full hover:cursor-pointer shadow-none"
                variant="outline"
              >
                <Hash
                  className="size-4 text-muted-foreground"
                  strokeWidth={2}
                />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="
                focus:outline-none focus:ring-0 focus:ring-offset-0
                dark:border-gray-900
              "
              onEscapeKeyDown={(KeyboardEvent) => {
                if (isAddingTag) {
                  KeyboardEvent.preventDefault();
                  setIsAddingTag(false);
                  setNewTag("");
                }
              }}
            >
              <DialogHeader className="pb-1">
                <DialogTitle className="flex justify-start items-center gap-3">
                  Manage Tags
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add keywords to group and find notes more easily.</p>
                    </TooltipContent>
                  </Tooltip>
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Type a tag name and press <kbd className="px-1 py-0.5 rounded border">Enter</kbd> to add.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 outline-none">
                <AnimatePresence
                  mode="popLayout"
                  initial={false}
                >
                  {tags.map((tag, index) => (
                    <motion.div
                      key={index}
                      className="
                        max-w-fit rounded-full
                        flex justify-center items-center gap-1.5
                        py-2 px-3
                        text-black bg-gray-200
                        dark:text-white dark:bg-gray-800 
                        hover:cursor-pointer hover:dark:bg-gray-700 hover:bg-gray-300
                        text-sm font-bold
                      "
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      onClick={() => {
                        const filteredTags = tags.filter((_, i) => i !== index);
                        handleTagsChange(filteredTags);
                      }}
                    >
                      {tag}
                      <X className="size-3 stroke-4" />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!isAddingTag ? (
                  <div
                    className="
                      max-w-fit rounded-full
                      flex justify-center items-center gap-1
                      py-2 px-3
                      text-black bg-gray-100
                      dark:text-white dark:bg-gray-900 
                      hover:dark:bg-gray-800 hover:bg-gray-200
                      hover:cursor-pointer
                      text-sm
                    "
                    onClick={() => {
                      setIsAddingTag(true);
                    }}
                  >
                    <Plus className="size-3" />
                    Add Tag
                  </div>
                ) : (
                  <Input
                    value={newTag}
                    autoFocus
                    onChange={(event) => setNewTag(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && newTag.trim()) {
                        event.preventDefault();
                        event.stopPropagation();
                        handleTagsChange([...tags, newTag.trim()]);
                        setNewTag("");
                      }
                      else if (event.key === "Escape" || event.key === "Enter" && !newTag.trim()) {
                        // Stop accepting input for new tags when escape key is pressed.
                        event.preventDefault();
                        event.stopPropagation();
                        setIsAddingTag(false);
                        setNewTag("");
                      }
                    }}
                    style={{ width: `${Math.max(10, newTag.length + 5)}ch` }}
                    className="
                      rounded-full
                      py-2 px-5 text-sm font-bold
                      bg-gray-100 text-black
                      dark:bg-gray-900 dark:text-white
                      focus:border-0
                    "
                  />
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
};

export default NoteTitleBar;