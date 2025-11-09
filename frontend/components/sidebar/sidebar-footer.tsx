import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ChevronUp, User2, Settings, Palette, Sparkles, Key, Eye, EyeOff } from "lucide-react";
import { Theme } from "@/types";
import { useSidebar } from "@/components/ui/sidebar";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface SidebarFooterAccountInfoProps {
  menuSelectedTheme: Theme;
  handleThemeChange: (theme: string) => void;
}

export const SidebarFooterAccountInfo = ({
  menuSelectedTheme,
  handleThemeChange
}: SidebarFooterAccountInfoProps) => {
  const { state, isMobile } = useSidebar();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dropdownMenuOpen, setDropdownMenuOpen] = useState(false);

  const form = useForm();

  const [apiKey, setApiKey] = useState("");
  const [selectedAIModel, setSelectedAIModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  return (
    <SidebarFooter
      className="
        dark:bg-gray-800 
        border-t 
        group-data-[collapsible=icon]:border-0 
        group-data-[collapsible=icon]:flex justify-center items-center
      "
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu open={dropdownMenuOpen} onOpenChange={setDropdownMenuOpen}>
            {/* User Icon Button */}
            <DropdownMenuTrigger asChild>
              {state === "collapsed" && !isMobile ? (
                <SidebarMenuButton className="flex justify-center items-center">
                  <User2 className="!size-5" />
                </SidebarMenuButton>
              ) : (
                <SidebarMenuButton>
                  <User2 /> Profile
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              )}
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={state === "collapsed" ? "right" : "top"}
              className="w-[--radix-popper-anchor-width]"
            >
              {/* Theme Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2.5">
                  <Palette className="!size-4" />
                  Theme
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                      value={menuSelectedTheme}
                      onValueChange={handleThemeChange}
                    >
                      <DropdownMenuRadioItem value="system">
                        System
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="dark">
                        Dark
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="light">
                        Light
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Button trigger for Settings Dialog */}
              <DropdownMenuItem
                className="cursor-pointer"
                onSelect={(event) => {
                  // Close the dropdown and then open dialog
                  event.preventDefault();
                  setDropdownMenuOpen(false);
                  setDialogOpen(true);
                }}
              >
                <div
                  className="flex items-center gap-2.5"
                >
                  <Settings className="!size-4 !text-foreground" />
                  Settings
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Dialog lives outside the menu so it doesn't get closed when the menu does. */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="px-10 py-12">
              <div className="gap-2 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  AI Provider
                </h1>
              </div>
              <form className="pb-2">
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
                          {showApiKey ? <Eye/> : <EyeOff/>}
                        </Button>
                      </div>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      <span className="text-xs text-muted-foreground">
                        Your API key is stored securely and never shared
                      </span>
                    </Field>
                  )}
                />
              </form>
              <div className="flex flex-col gap-2 pb-4">
                <FieldLabel>
                  Model
                </FieldLabel>
                <Select onValueChange={setSelectedAIModel}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>OpenAI</SelectLabel>
                      <SelectItem value="GPT-5">GPT-5</SelectItem>
                      <SelectItem value="GPT-5 mini">GPT-5 mini</SelectItem>
                      <SelectItem value="GPT-4o">GPT-4o</SelectItem>
                      <SelectItem value="GPT-4.1">GPT-4.1</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">
                  Choose your preferred AI model for Note-a-log
                </span>
              </div>
              <DialogFooter className="flex !justify-start">
                <Button 
                  className="w-full hover:cursor-pointer"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
};