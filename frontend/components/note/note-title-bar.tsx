import { KeyboardEvent } from "react";
import { Hash, Tag, Tags, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface NoteTitleBarProps {
  title: string;
  content: string;
  handleTitleChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
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
  handleTitleChange,
  isSaved
}: NoteTitleBarProps) => {

  const [tags, setTags] = useState(["hello", "world", "Python"]);
  const [isAddingTag, setIsAddingTag] = useState(false);

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
            <DialogContent className="dark:border-gray-900">
              <DialogHeader className="pb-4">
                <DialogTitle>Manage Tags</DialogTitle>
              </DialogHeader>
              <div className="flex flex-wrap gap-2 outline-none">
                {tags.map((tag) => (
                  <div
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
                      const filteredTags = tags.filter((existingTag) => existingTag !== tag);
                      setTags(filteredTags);
                    }}
                  >
                    {tag}
                    <X className="size-3 stroke-4" />
                  </div>
                ))}
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

                  }}
                >
                  <Plus className="size-3" />
                  Add Tag
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  )
};

export default NoteTitleBar;