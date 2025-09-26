import { Textarea } from "@/components/ui/textarea";
import { Check, LoaderCircle } from "lucide-react";

interface NoteTitleBarProps {
  title: string;
  content: string;
  handleTitleChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
  isSaved: boolean;
}

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
          <Check className="size-4" />
        ) : (
          <LoaderCircle className="size-4 animate-spin" />
        )}
      </div>
    )}
  </div>
);

export default NoteTitleBar;