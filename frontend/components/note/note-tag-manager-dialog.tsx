import { Hash, X, Sparkles, MapPin, LocateFixed, Tags, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
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
import { useSidebar } from "@/components/ui/sidebar";

interface NoteTagManagerDialogProps {
  noteID: string;
  title: string;
  content: string;
  tags: string[];
  location: string;
  handleTagsChange: (noteTags: string[]) => void;
  handleLocationChange: (location: string) => void;
  isSaved: boolean;
}

const NoteTagManagerDialog = ({
  noteID,
  title,
  content,
  tags,
  location,
  handleTagsChange,
  handleLocationChange,
  isSaved
}: NoteTagManagerDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationValueEdit, setLocationValueEdit] = useState("");
  const abortAPICallRef = useRef<AbortController | null>(null);

  const { selectedAIModel, ollamaURL, ollamaAIModel, computeLocation } = useAISettingsStore();
  const [deviceCoordinates, setDeviceCoordinates] = useState<{ latitude: number, longitude: number } | undefined>(undefined);

  const getDeviceCoordinatesMobile = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject("Geolocation not supported");
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  };

  const getLocation = async () => {
    let coordinates;

    const response: any = await getDeviceCoordinatesMobile();
    if (response?.latitude !== null && response?.longitude !== null)
      coordinates = response;

    setDeviceCoordinates(coordinates);

    if (coordinates) {
      const response = await axios.post("/api/location", coordinates);
      const locationTags = response.data;
      console.log(locationTags);
      if (locationTags)
        handleLocationChange(locationTags.join(", "));
    }
  };

  useEffect(() => {
    setSuggestedTags([]);
  }, [noteID]);

  // --- Tag Generation ---
  const handleGenerateTagsClick = async () => {
    try {
      setLoadingTags(true);
      setSuggestedTags([]);

      const abortController = new AbortController();
      abortAPICallRef.current = abortController;

      if (computeLocation === "cloud") {
        const response = await axios.post(
          "/api/ai/generate-tags",
          { title, content, tags, locationTag: location, selectedAIModel },
          { signal: abortController.signal }
        );

        const generatedTags = response.data as string[];

        if (generatedTags) {
          setSuggestedTags(generatedTags);
          //handleTagsChange([...tags, ...generatedTags]);
        }
      }
      else {
        const generated = await generateTagsOllama(title, content, tags, ollamaURL, ollamaAIModel, abortController);
        setSuggestedTags(generated);
        //handleTagsChange([...tags, ...generated]);
      }
    }
    catch (error) {
      console.error(error);
    }
    finally {
      setLoadingTags(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={!isSaved}
          variant={tags?.length > 0 ? "outline" : "ghost"}
          className="flex items-center gap-1 rounded-full shadow-none"
        >
          {tags?.length > 0 
            ? 
              <>
                <Tags className="size-4" strokeWidth={2} />
                <span className="flex items-center tabular-nums">
                  <span className="opacity-30 mr-1 text-[10px] select-none">•</span>
                  {tags.length}
                </span>
              </>
            :
              <Tags className="size-4.5" strokeWidth={2} />}
        </Button>
      </DialogTrigger>

      <DialogContent
        className="max-h-[90vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-950 focus:outline-none"
        onEscapeKeyDown={(event) => {
          if (editingLocation) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="flex flex-col justify-start gap-4">
          <DialogTitle>Tags</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Active Tags Input Area */}
          <div className="flex flex-wrap gap-2 min-h-[40px] p-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {tags.map((tag, index) => (
                <motion.div
                  key={`${tag}-${index}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-200 dark:bg-gray-800 text-sm font-bold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleTagsChange(tags.filter((_, i) => i !== index))}
                >
                  {tag} <X className="size-3" />
                </motion.div>
              ))}
            </AnimatePresence>
            {loadingTags ?
              <div className="flex gap-2 w-full">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div> :
              suggestedTags?.length == 0 && <Input
                value={newTag}
                placeholder="Add tag..."
                onChange={(event) => setNewTag(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && newTag.trim()) {
                    handleTagsChange([...tags, newTag.trim()]);
                    setNewTag("");
                  }
                }}
                style={{ width: `${Math.max(12, newTag.length + 2)}ch` }}
                className="flex justify-center items-center border bg-gray-100 dark:bg-gray-900 focus-visible:ring-0 px-3 py-3 font-bold placeholder:font-normal rounded-full"
              />
            }
            {
            <AnimatePresence mode="popLayout" initial={false}>
              {suggestedTags?.length > 0 && suggestedTags.map((suggestedTag, index) => (
                <motion.div
                  key={`${suggestedTag}-${index}`}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-200 dark:bg-gray-800 text-sm font-bold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700 text-muted-foreground"
                  onClick={() => {
                    setSuggestedTags(suggestedTags.filter(suggestedTagToKeep => suggestedTagToKeep !== suggestedTag));
                    handleTagsChange([...tags, suggestedTag]);
                  }}
                >
                  <Plus className="size-3" /> {suggestedTag}
                </motion.div>
              ))}
              {suggestedTags?.length > 0 &&
              <>
              <Button 
                variant="default" 
                className="flex items-center gap-1.5 py-2 px-3 rounded-full shadow-none font-bold placeholder:font-normal hover:cursor-pointer"
                onClick={() => {
                  handleTagsChange([...tags, ...suggestedTags]);
                  setSuggestedTags([]);
                }}
              >
                <Plus className="size-3"/> Add All
              </Button>
              <Button 
                variant="link" 
                className="rounded-full shadow-none font-bold placeholder:font-normal hover:cursor-pointer"
                onClick={() => {
                  setSuggestedTags([]);
                }}
              >
                <X className="size-5"/>
              </Button>
              </>
              }
            </AnimatePresence>            
            }
          </div>

          <div className="flex items-center gap-1">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location}
                className="pb-1 px-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                exit={{ opacity: 0 }}
              >
                {location
                  ?
                  (<div className="flex items-center gap-1">
                    {!editingLocation ? <div
                      className="
                        w-fit
                        flex items-center 
                        gap-1.5 py-1.5 px-3 
                        rounded-full 
                        bg-blue-50 dark:bg-blue-900/20 
                        border border-blue-100 dark:border-blue-800 
                        text-blue-700 dark:text-blue-300 
                        text-sm font-bold
                        hover:cursor-pointer hover:bg-white-50 hover:dark:bg-gray-900/20
                      "
                      aria-disabled={loadingLocation}
                      onClick={() => setEditingLocation(!editingLocation)}
                    >
                      <MapPin className="size-3.5" strokeWidth={2.5} />
                      {location}
                    </div> :
                      <Input
                        style={{ width: `${Math.max(24, locationValueEdit.length + 2)}ch` }}
                        placeholder="Enter Location..."
                        className="
                        flex items-center 
                        gap-1.5 py-1.5 px-3 
                        rounded-full 
                        bg-blue-50 dark:bg-blue-900/20 
                        border border-blue-100 dark:border-blue-800 
                        text-blue-700 dark:text-blue-300 
                        text-sm font-bold
                        hover:cursor-pointer hover:bg-white-50 hover:dark:bg-gray-900/20
                      "
                        defaultValue={location}
                        onChange={(event) => setLocationValueEdit(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && locationValueEdit.trim()) {
                            handleLocationChange(locationValueEdit.trim());
                            setLocationValueEdit("");
                            setEditingLocation(false);
                          }
                          else if (event.key === "Escape") {
                            setEditingLocation(false);
                          }
                        }}
                      >
                      </Input>}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-auto w-auto p-2 hover:cursor-pointer"
                      disabled={loadingLocation}
                      onClick={async () => {
                        setLoadingLocation(true);
                        await getLocation();
                        setLoadingLocation(false);
                      }}
                    >
                      <LocateFixed className="size-4.5" />
                    </Button>
                  </div>)
                  :
                  <Button
                    className="
                    flex items-center gap-1.5 p-1.5 px-3 rounded-full 
                    bg-blue-50/50 hover:bg-blue-100 
                    dark:bg-blue-900/10 dark:hover:bg-blue-900/30 
                    border border-dashed border-blue-300 dark:border-blue-700 
                    text-blue-600 dark:text-blue-400 
                    text-sm font-bold
                    hover:cursor-pointer
                  "
                    onClick={async () => {
                      setLoadingLocation(true);
                      await getLocation();
                      setLoadingLocation(false);
                    }}
                    disabled={loadingLocation}
                  >
                    <MapPin className="size-3.5" strokeWidth={2.5} />
                    <span>Get Location</span>
                  </Button>
                }
              </motion.div>
            </AnimatePresence>
          </div>
          {/* AI Tag Generation Button Area */}
          <div className="flex items-center justify-between p-1">
            <Button
              size="default"
              variant="ghost"
              onClick={handleGenerateTagsClick}
              disabled={loadingTags}
              className="flex justify-center items-center gap-2 py-3 rounded-full text-white bg-blue-600 dark:bg-blue-800"
            >
              <Sparkles className="size-3.5" />
              Generate Tags
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteTagManagerDialog;