import { Key, KeyboardEvent, ChangeEvent, useEffect } from "react";
import { Hash, Info, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";

interface NoteTitleBarProps {
  title: string;
  content: string;
  tags: string[];
  handleTitleChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  handleTagsChange: (noteTags: string[]) => void;
  isSaved: boolean;
}

const handleEnterKey = (
  event: KeyboardEvent<HTMLTextAreaElement>
) => {
  if (event.key === "Enter") {
    event.preventDefault(); // Prevent newline on textarea
  }
};

const NoteTitleBar = ({
  title,
  content,
  tags,
  handleTitleChange,
  handleTagsChange,
  isSaved
}: NoteTitleBarProps) => {

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
        onKeyDown={handleEnterKey}
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
          <Dialog>
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
              className="dark:border-gray-900"
              onEscapeKeyDown={(KeyboardEvent) => {
                // Prevents the dialog from closing, this will pass the event
                // down to any children handlers.
                KeyboardEvent.preventDefault();
              }}
            >
              <DialogHeader className="pb-4">
                <DialogTitle className="flex justify-start items-center gap-3">
                  Manage Tags
                  <Info className="size-4" />
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 outline-none">
                {tags.map((tag, index) => (
                  <div
                    key={index}
                    className="
                      max-w-fit rounded-full
                      flex justify-center items-center gap-1.5
                      py-2 px-3
                      text-black bg-gray-200
                      dark:text-white dark:bg-gray-800 
                      hover:cursor-pointer
                      text-sm font-bold
                    "
                    onClick={() => {
                      const filteredTags = tags.filter((_, i) => i !== index);
                      handleTagsChange(filteredTags);
                    }}
                  >
                    {tag}
                    <X className="size-3 stroke-4" />
                  </div>
                ))}
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
                      } else if (event.key === "Escape") {
                        // Revert input area for tags back to an 'add tag' prompt.
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