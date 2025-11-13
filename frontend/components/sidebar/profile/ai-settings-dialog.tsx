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
  const [showApiKey, setShowApiKey] = useState(false);
  const {
    apiKey,
    setApiKey,
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

  if (apiKey && selectedAIModel || !useCustomAISettings) {
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
        if (!open) {
          setShowApiKey(false);
        }
      }}
    >
      <DialogContent
        className="px-10"
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
              AI Configuration
            </h1>
            <div className="flex justify-center items-center relative">
              <TabsList>
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
                    setApiKey("");
                    setSelectedAIModel("");
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
                <div className="text-center space-y-3 max-w-md">
                  <p className="text-sm text-muted-foreground">
                    Bringing your own API key or selecting a different model? Enable custom configuration below.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setUseCustomAISettings(true)}
                  className="gap-2 mt-2"
                >
                  <Settings className="size-4" />
                  Use Custom Configuration
                </Button>
              </div>
            ) : (
              <>
                <form className="pb-4">
                  <Controller
                    name="title"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field className="!gap-2" data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name}>
                          <Key className="size-4" />
                          API Key
                        </FieldLabel>
                        <div className="relative">
                          <Input
                            {...field}
                            id={field.name}
                            aria-invalid={fieldState.invalid}
                            type={showApiKey ? "text" : "password"}
                            placeholder="sk-xxxxxxxxx"
                            className="pr-10"
                            autoComplete="off"
                            onChange={(event) => setApiKey(event.target.value)}
                            onKeyDown={(event) => {
                              // Prevents toggling the button for showing/hiding api key
                              if (event.key === "Enter") {
                                event.preventDefault();
                              }
                            }}
                            value={apiKey ?? ""}
                          />
                          <Button
                            variant="ghost"
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              setShowApiKey(!showApiKey);
                            }}
                          >
                            {showApiKey ? <EyeOff /> : <Eye />}
                          </Button>
                        </div>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        <span className="text-xs text-muted-foreground">
                          For security purposes, your API key is only saved for the current session.
                          Subsequent sessions will require you to re-enter your API key.
                          Note-a-log will never store your API key in its servers.
                        </span>
                      </Field>
                    )}
                  />
                </form>

                <div className="flex flex-col gap-2 pb-4">
                  <FieldLabel>
                    Model
                  </FieldLabel>
                  <Select onValueChange={setSelectedAIModel} defaultValue={selectedAIModel ?? ""}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Google</SelectLabel>
                        <SelectItem value="google:gemini-2.5-flash">Gemini 2.5 Flash</SelectItem>
                        <SelectLabel>OpenAI</SelectLabel>
                        <SelectItem value="openai:gpt-5">GPT-5</SelectItem>
                        <SelectItem value="openai:gpt-5-mini">GPT-5 mini</SelectItem>
                        <SelectItem value="openai:gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="openai:gpt-4.1">GPT-4.1</SelectItem>
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
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Meta</SelectLabel>
                    <SelectItem value="llama3.2:3b">Llama 3.2 3b</SelectItem>
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