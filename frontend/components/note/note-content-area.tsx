import { ChangeEvent, Ref } from "react";
import { Textarea } from "@/components/ui/textarea";

interface NoteContentAreaProps {
  content: string;
  handleContentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  textAreaRef?: Ref<HTMLTextAreaElement>;
}

const NoteContentArea = ({
  content,
  handleContentChange,
  textAreaRef
}: NoteContentAreaProps) => (
  <Textarea
    ref={textAreaRef}
    value={content}
    onChange={handleContentChange}
    className="
      flex-1
      bg-gray-50 dark:bg-gray-800 dark:border-gray-800
      border-t-0 rounded-t-none
      rounded-b-none md:rounded-b-md
      !text-lg 
      resize-none shadow-none
    "
    placeholder="Content"
  />
);

export default NoteContentArea;