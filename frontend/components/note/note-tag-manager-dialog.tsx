import { Hash, X, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef, useEffect } from "react";
import useAISettingsStore from "@/stores/useAISettingsStore";
import { generateTagsOllama } from "@/lib/local-ai-inference-ollama";

interface NoteTagManagerDialog {
  title: string;
  content: string;
  tags: string[];
  handleTagsChange: (noteTags: string[]) => void;
  isSaved: boolean;
}

const NoteTagManagerDialog = ({
  title,
  content,
  tags,
  handleTagsChange,
  isSaved
}: NoteTagManagerDialog) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortAPICallRef = useRef<AbortController | null>(null);
  const { apiKey, selectedAIModel, ollamaURL, ollamaAIModel, computeLocation } = useAISettingsStore();

  useEffect(() => {
    // Cancel in-flight API call when tag manager dialog is closed.
    if (!dialogOpen) {
      setLoading(false);
      abortAPICallRef.current?.abort();
      abortAPICallRef.current = null;
      return;
    }
  }, [dialogOpen, title, content]);

  const handleGenerateTagsClick = async () => {
    try {
      setLoading(true);
      setSuggestedTags([]);

      const abortController = new AbortController();
      abortAPICallRef.current = abortController;

      if (computeLocation === "cloud") {
        await generateTagsUsingAI(abortController);
      }
      else {
        await generateTagsUsingOllama(abortController);
      }
    }
    finally {
      setLoading(false);
    }
  };

  const generateTagsUsingAI = async (abortController: AbortController) => {
    try {
      const response = await axios.post(
        "/api/ai/generate-tags",
        { title, content, tags, selectedAIModel, apiKey },
        { signal: abortController.signal }
      );
      setSuggestedTags(response.data);
    }
    catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.code === "ERR_CANCELED") return;
      }
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
      console.error(error);
    }
  };

  const generateTagsUsingOllama = async (abortController: AbortController) => {
    try {
      const tags: string[] = await generateTagsOllama(
        title,
        content,
        ollamaURL,
        ollamaAIModel,
        abortController
      );
      setSuggestedTags(tags);
    }
    catch (error: unknown) {
      console.error(error);
    }
  };

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(nextOpen) => {
        setDialogOpen(nextOpen);
        // when closing, reset tag state and clear input
        if (!nextOpen) {
          setIsAddingTag(false);
          setNewTag("");
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
          max-h-full overflow-auto 
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
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-5">
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
            <Input
              value={newTag}
              placeholder="Type tag..."
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
              style={{ width: `${Math.max(12, newTag.length + 3)}ch` }}
              className="
                rounded-full
                py-2 px-5 text-sm font-bold
                bg-gray-100 hover:bg-gray-200 text-black
                dark:bg-gray-900 hover:dark:bg-gray-800 dark:text-white
                placeholder:font-normal
                border-0
              "
            />
          </div>
          <AnimatePresence mode="sync">
            {(suggestedTags.length > 0 || loading) && (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex flex-col justify-start gap-3"
              >
                <h3 className="pb-1">Suggestions</h3>
                <div className="flex flex-wrap gap-3 outline-none">
                  <AnimatePresence
                    mode="popLayout"
                    initial={false}
                  >
                    {suggestedTags.length > 0 ? suggestedTags.map((tag, index) => (
                      <motion.div
                        key={index}
                        className="
                          max-w-fit rounded-full
                          flex justify-center items-center gap-1.5
                          py-2 px-3
                          text-muted-foreground
                          bg-gray-100 dark:bg-gray-900 
                          hover:cursor-pointer hover:dark:bg-gray-800 hover:bg-gray-200
                          text-sm
                        "
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        onClick={() => {
                          const selectedTag = suggestedTags[index];
                          const remainingTags = suggestedTags.filter((_, i) => i !== index);
                          setSuggestedTags(remainingTags);
                          handleTagsChange([...tags, selectedTag]);
                        }}
                      >
                        <Plus className="size-3" />
                        {tag}
                      </motion.div>
                    )) :
                      <div className="pl-2">
                        <div className="flex items-center space-x-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                        </div>
                      </div>}
                  </AnimatePresence>
                </div>
              </motion.div>)}
          </AnimatePresence>
        </div>
        <DialogFooter className="!justify-start">
          {!loading && <Button
            className="max-w-fit rounded-full bg-blue-200 dark:bg-blue-900 hover:cursor-pointer"
            variant="ghost"
            disabled={loading}
            onClick={handleGenerateTagsClick}
          >
            Generate
            <Sparkles />
          </Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NoteTagManagerDialog;