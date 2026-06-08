import {
  Sparkles,
  Key,
  Eye,
  EyeOff,
  Server,
  Settings,
  RotateCcw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import useAISettingsStore, { ComputeLocation } from "@/stores/useAISettingsStore";

interface AISettingsDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (dialogOpen: boolean) => void;
}

export const AISettingsDialog = ({
  dialogOpen,
  setDialogOpen
}: AISettingsDialogProps) => {
  const form = useForm();
  const {
    selectedAIModel,
    setSelectedAIModel,
    ollamaURL,
    setOllamaURL,
    ollamaAIModel,
    setOllamaAIModel,
    computeLocation,
    setComputeLocation,
    useCustomAISettings,
    setUseCustomAISettings
  } = useAISettingsStore();

  let statusColorCloud;
  let statusColorLocal;

  if (selectedAIModel || !useCustomAISettings) {
    statusColorCloud = "bg-green-500";
  }
  else {
    statusColorCloud = "bg-red-500";
  }

  if (ollamaURL && ollamaAIModel) {
    statusColorLocal = "bg-green-500";
  }
  else {
    statusColorLocal = "bg-red-500";
  }

  return (
    <Dialog
      open={dialogOpen}
      onOpenChange={(open) => {
        setDialogOpen(open);
      }}
    >
      <DialogContent
        className="px-10 dark:bg-gray-950 dark:border-gray-950"
        onOpenAutoFocus={(event) => event.preventDefault()} // don't highlight api key field by default
      >
        <Tabs
          value={computeLocation}
          onValueChange={(value) => setComputeLocation(value as ComputeLocation)}
        >
          <div className="gap-2 text-center pb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground pb-3">
              AI Settings
            </h1>
            <div className="flex justify-center items-center relative">
              <TabsList className="dark:bg-gray-950 dark:border-0">
                <TabsTrigger
                  value="cloud"
                  className="relative"
                >
                  <span className="flex items-center gap-2 relative">
                    {computeLocation === "cloud" && (
                      <span className={`w-2 h-2 rounded-full ${statusColorCloud}`} />
                    )}
                    Cloud
                  </span>
                </TabsTrigger>
                {useCustomAISettings && (<TabsTrigger
                  value="local"
                  className="relative"
                >
                  <span className="flex items-center gap-2">
                    {computeLocation === "local" && (
                      <span className={`w-2 h-2 rounded-full ${statusColorLocal}`} />
                    )}
                    Local
                  </span>
                </TabsTrigger>
                )}
              </TabsList>
              {useCustomAISettings && <div className="flex justify-start items-center absolute right-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setUseCustomAISettings(false);
                    setComputeLocation("cloud");
                    //setSelectedAIModel("");
                  }}
                  className="hover:cursor-pointer"
                >
                  <RotateCcw className="size-4 stroke-2"/>
                </Button>
              </div>}
            </div>
          </div>
          <TabsContent value="cloud">
            {!useCustomAISettings ? (
              <div className="flex flex-col items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => setUseCustomAISettings(true)}
                  className="gap-2 mt-2"
                >
                  <Settings className="size-4" />
                  Customize Configuration
                </Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 pb-4">
                  <FieldLabel>
                    Model
                  </FieldLabel>
                  <Select onValueChange={setSelectedAIModel} defaultValue={selectedAIModel || "google:gemini-3.1-flash-lite"}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-950">
                      <SelectGroup>
                        <SelectLabel>Google</SelectLabel>
                        <SelectItem value="google:gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</SelectItem>
                        <SelectLabel>Mistral</SelectLabel>
                        <SelectItem value="mistral:mistral-small-latest">Mistral Small</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </TabsContent>
          <TabsContent value="local">
            <form className="pb-6">
              <Controller
                name="title"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field className="!gap-2" data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <Server className="size-4" />
                      Ollama URL
                    </FieldLabel>
                    <div>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="http://localhost:11434"
                        autoComplete="off"
                        onChange={(event) => setOllamaURL(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                          }
                        }}
                        value={ollamaURL ?? ""}
                      />
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      To enable your browser to connect securely to a locally running Ollama daemon, add this site’s URL to the environment variable <strong>OLLAMA_ORIGINS</strong>.<br />
                      For example:<br />
                      <code className="block text-[10px] bg-muted/30 p-1 rounded my-1">
                        OLLAMA_ORIGINS=https://note-a-log.vercel.app
                      </code>
                      Then restart Ollama (or your container) to apply the change.
                    </span>

                  </Field>
                )}
              />
            </form>
            <div className="flex flex-col gap-2 pb-4">
              <FieldLabel>
                Model
              </FieldLabel>
              <Select onValueChange={setOllamaAIModel} defaultValue={ollamaAIModel ?? ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-950">
                  <SelectGroup>
                    <SelectLabel>Meta</SelectLabel>
                    <SelectItem value="llama3.2:3b">Llama 3.2 3b</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>Google</SelectLabel>
                    <SelectItem value="gemma4:e4b">Gemma 4 e4b</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};