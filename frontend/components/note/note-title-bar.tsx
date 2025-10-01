import { KeyboardEvent } from "react";
import { Hash, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
}: NoteTitleBarProps) => (
  <div className="relative w-full">
    <Textarea
      value={title}
      onChange={handleTitleChange}
      className="
        h-6 pr-12
        bg-gray-50 dark:bg-gray-800 dark:border-gray-800
        rounded-t-none md:rounded-t-md
        border-b-0 rounded-b-none
        !text-2xl font-semibold
        resize-none shadow-none
      "
      placeholder="Title"
      onKeyDown={handleEnterKey}
    />

    {/* Save Button - appears when there's content */}
    {(title || content) && (
      <div
        className="
          absolute right-2 top-3/8 -translate-y-1/2
          p-3
          text-gray-800 dark:text-gray-200
          transition-opacity
        "
      >
        {isSaved ? (
          <Tooltip>
            <TooltipTrigger>
              <Button
                size="icon"
                className="rounded-full hover:cursor-pointer shadow-none"
                variant="outline"
              >
                <Hash
                  className="size-4 text-muted-foreground"
                  strokeWidth={2}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="" side="bottom">
              <p>Edit Tags</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
        )}
      </div>
    )}
  </div>
);

export default NoteTitleBar;