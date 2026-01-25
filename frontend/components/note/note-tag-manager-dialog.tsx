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
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useRef, useEffect } from "react";
import useAISettingsStore from "@/stores/useAISettingsStore";
import { generateTagsOllama } from "@/lib/local-ai-inference-ollama";

interface NoteTagManagerDialogProps {
  noteID: string;
  title: string;
  content: string;
  tags: string[];
  handleTagsChange: (noteTags: string[]) => void;
  isSaved: boolean;
}

const NoteTagManagerDialog = ({
  noteID,
  title,
  content,
  tags,
  handleTagsChange,
  isSaved
}: NoteTagManagerDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortAPICallRef = useRef<AbortController | null>(null);
  
  const { apiKey, selectedAIModel, ollamaURL, ollamaAIModel, computeLocation } = useAISettingsStore();
  const [locationCheckboxActive, setLocationCheckboxActive] = useState(false);
  const [deviceCoordinates, setDeviceCoordinates] = useState<{ latitude: number, longitude: number } | undefined>(undefined);
  const [locationTag, setLocationTag] = useState("");

  // --- Geolocation Logic ---
  const getDeviceCoordinates = async () => {
    try {
      const response = await axios.post(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${process.env.NEXT_PUBLIC_GOOGLE_GEOLOCATION_API_KEY}`,
        { "considerIp": true }
      );

      const { lat, lng } = response.data.location;

      if (lat !== undefined && lng !== undefined)
        return { latitude: lat, longitude: lng };
      else 
        return undefined;
    } 
    catch (error) {
      console.error("Failed to get coordinates:", error);
      return undefined;
    }
  };

  const getLocationFromCoordinates = async (
    latitude: number, 
    longitude: number
  ) => {
    try {
      // Call Google Geolocation API
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${
          process.env.NEXT_PUBLIC_GOOGLE_GEOLOCATION_API_KEY
        }`
      );

      // Get an address portion from the Google Geolocation API response.
      // (i.e. locality, country, etc.)
      const getAddressPart = (type: string) => {
        const component = response.data.results[0]?.address_components.find(
          (component: any) => component.types.includes(type)
        );
        return component ? component.short_name : null;
      };

      // For the U.S -- returns [city, county, state, country]
      return [
        getAddressPart("locality"), 
        getAddressPart("administrative_area_level_2"), 
        getAddressPart("administrative_area_level_1"), 
        getAddressPart("country")
      ].filter(Boolean) as string[];
    } 
    catch (error) {
      console.error("Failed to get location:", error);
      return undefined;
    }
  };

  useEffect(() => {
    const invokeGetCoordinates = async () => {
      if (locationCheckboxActive) {
        setLoading(true);

        const coordinates = await getDeviceCoordinates();
        setDeviceCoordinates(coordinates);

        if (coordinates) {
          const locationTags = await getLocationFromCoordinates(
            coordinates.latitude, 
            coordinates.longitude
          );
          if (locationTags) 
            setSuggestedTags(previous => [...new Set([...previous, ...locationTags])]);
        }
        setLoading(false);
      }
    };
    invokeGetCoordinates();
  }, [locationCheckboxActive]);

  useEffect(() => {
    setSuggestedTags([]);
  }, [noteID]);

  // --- Tag Generation ---
  const handleGenerateTagsClick = async () => {
    try {
      setLoading(true);
      setSuggestedTags([]);
      let detectedLocation = "";

      if (deviceCoordinates) {
        const response = await axios.post("/api/get-user-location", deviceCoordinates);
        detectedLocation = response.data?.location || "";
        setLocationTag(detectedLocation);
      }

      const abortController = new AbortController();
      abortAPICallRef.current = abortController;

      if (computeLocation === "cloud") {
        const response = await axios.post(
          "/api/ai/generate-tags", 
          { title, content, tags, locationTag: detectedLocation, selectedAIModel, apiKey }, 
          { signal: abortController.signal }
        );
        setSuggestedTags(response.data);
      } 
      else {
        const generated = await generateTagsOllama(title, content, tags, ollamaURL, ollamaAIModel, abortController);
        setSuggestedTags(generated);
      }
    } 
    catch (error) {
      console.error(error);
    } 
    finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button disabled={!isSaved} variant="outline" className="flex items-center gap-1 rounded-full shadow-none">
          <Hash className="size-4 text-muted-foreground" strokeWidth={2} />
          <span className="text-muted-foreground text-sm">Tags</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto dark:bg-gray-950 dark:border-gray-950 focus:outline-none">
        <DialogHeader>
          <DialogTitle>Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Active Tags Input Area */}
          <div className="flex flex-wrap gap-2 min-h-[40px] p-1">
            <AnimatePresence mode="popLayout" initial={false}>
              {tags.map((tag, index) => (
                <motion.div
                  key={`${tag}-${index}`}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 py-2 px-3 rounded-full bg-gray-200 dark:bg-gray-800 text-sm font-bold cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-700"
                  onClick={() => handleTagsChange(tags.filter((_, i) => i !== index))}
                >
                  {tag} <X className="size-3" />
                </motion.div>
              ))}
            </AnimatePresence>
            <Input
              value={newTag}
              placeholder="Add tag..."
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newTag.trim()) {
                  handleTagsChange([...tags, newTag.trim()]);
                  setNewTag("");
                }
              }}
              style={{ width: `${Math.max(12, newTag.length + 2)}ch` }}
              className="flex justify-center items-center border-0 bg-gray-100 dark:bg-gray-900 focus-visible:ring-0 px-3 py-5 h-8 font-bold placeholder:font-normal rounded-full"
            />
          </div>

          {/* AI Toolbar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-100 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <Switch 
                id="location-toggle" 
                checked={locationCheckboxActive} 
                onCheckedChange={setLocationCheckboxActive} 
                className=""
              />
              <Label htmlFor="location-toggle" className="text-sm font-medium cursor-pointer">
                Location
              </Label>
            </div>
            <Button 
              size="default" 
              variant="ghost" 
              onClick={handleGenerateTagsClick} 
              disabled={loading}
              className="flex justify-center items-center gap-2 py-3"
            >
              Generate
              <Sparkles className="size-3.5" />
            </Button>
          </div>

          {/* Suggestions Area */}
          <AnimatePresence mode="sync">
            {(suggestedTags.length > 0 || loading) && (
              <motion.div
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-3"
              >
                <h4 className="text-muted-foreground uppercase tracking-wider font-bold px-1">
                  Suggestions
                </h4>
                <div className="flex flex-wrap gap-2">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {suggestedTags.length > 0 ? (
                      suggestedTags.map((tag) => (
                        <motion.div
                          key={tag}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center gap-1 py-1.5 px-3 rounded-full bg-gray-100 dark:bg-gray-900 text-sm text-muted-foreground cursor-pointer hover:bg-gray-200 dark:hover:bg-white/10 border border-transparent transition-all"
                          onClick={() => {
                            setSuggestedTags(prev => prev.filter(t => t !== tag));
                            handleTagsChange([...tags, tag]);
                          }}
                        >
                          <Plus className="size-3" /> {tag}
                        </motion.div>
                      ))
                    ) : (
                      <div className="flex gap-2 w-full">
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-full" />
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteTagManagerDialog;