"use client"

import { KeyboardEvent, ChangeEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import NoteTagManagerDialog from "@/components/note/note-tag-manager-dialog";

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
}: NoteTitleBarProps) => (
  <div className="relative w-full">
    <Textarea
      value={title}
      onChange={handleTitleChange}
      className="
          !h-2 !pb-0
          pr-15
          border-t-0 sm:border-t-1 
          rounded-t-none md:rounded-t-md
          border-b-1 rounded-b-none
          bg-gray-50 
          dark:bg-gray-800 
          dark:border-gray-800 dark:border-b-gray-700
          !text-2xl font-semibold
          resize-none shadow-md
          scrollbar-chrome-thin
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
        <NoteTagManagerDialog
          title={title}
          content={content}
          tags={tags}
          handleTagsChange={handleTagsChange}
          isSaved={isSaved}
        />
      </div>
    )}
  </div>
);

export default NoteTitleBar;