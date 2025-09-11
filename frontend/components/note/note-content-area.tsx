import { Textarea } from "@/components/ui/textarea";

interface NoteContentAreaProps {
  content: string;
  handleContentChange: (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => void;
}

const NoteContentArea = ({
  content,
  handleContentChange
}: NoteContentAreaProps) => (
  <Textarea
    value={content}
    onChange={handleContentChange}
    className="
      flex-1
      bg-gray-50 dark:bg-gray-800 dark:border-gray-800
      border-t-0 rounded-t-none
      !text-lg 
      resize-none shadow-none
    "
    placeholder="Content"
  />
);

export default NoteContentArea;