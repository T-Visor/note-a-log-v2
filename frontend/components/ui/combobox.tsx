"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

const frameworks = [
  { value: "next.js", label: "Next.js" },
  { value: "sveltekit", label: "SvelteKit" },
  { value: "nuxt.js", label: "Nuxt.js" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue.js" },
  { value: "angular", label: "Angular" },
  { value: "ember", label: "Ember.js" },
  { value: "backbone", label: "Backbone.js" },
  { value: "preact", label: "Preact" },
  { value: "solid", label: "SolidJS" },
  { value: "marko", label: "Marko" },
  { value: "alpine", label: "Alpine.js" },
  { value: "lit", label: "Lit" },
  { value: "inferno", label: "Inferno" },
  { value: "blitz", label: "Blitz.js" },
  { value: "quasar", label: "Quasar" },
  { value: "stencil", label: "Stencil.js" },
  { value: "fresh", label: "Fresh" },
  { value: "qwik", label: "Qwik" },
  { value: "eleventy", label: "Eleventy" },
  { value: "hexo", label: "Hexo" },
  { value: "gatsby", label: "Gatsby.js" },
  { value: "gridsome", label: "Gridsome" },
  { value: "vuepress", label: "VuePress" },
  { value: "vitepress", label: "VitePress" },
  { value: "parcel", label: "Parcel" },
  { value: "snowpack", label: "Snowpack" },
  { value: "dozer", label: "Dozer" },
  { value: "plasmic", label: "Plasmic" },
  { value: "elderjs", label: "Elder.js" },
  { value: "nexus", label: "Nexus" },
  { value: "brunch", label: "Brunch" },
  { value: "volt", label: "Volt" },
  { value: "derby", label: "Derby.js" },
  { value: "meteor", label: "Meteor" },
  { value: "dojo", label: "Dojo" },
  { value: "appgyver", label: "AppGyver" },
  { value: "weweb", label: "WeWeb" },
  { value: "panel", label: "Panel.js" },
  { value: "hydrogen", label: "Hydrogen" },
  { value: "zesty", label: "Zesty.io" },
  { value: "jigsaw", label: "Jigsaw" },
  { value: "codux", label: "Codux" },
  { value: "unityweb", label: "Unity Web" },
  { value: "webc", label: "WebC" },
  { value: "fast", label: "FAST" },
  { value: "skruv", label: "Skruv" },
  { value: "sapper", label: "Sapper" },
  { value: "react-static", label: "React Static" },
  { value: "after.js", label: "After.js" },
  { value: "crank", label: "Crank.js" },
  { value: "riot", label: "Riot.js" },
  { value: "maquette", label: "Maquette" },
  { value: "rivets", label: "Rivets.js" },
  { value: "mithril", label: "Mithril.js" },
  { value: "canjs", label: "CanJS" },
  { value: "chaplin", label: "Chaplin.js" },
  { value: "flight", label: "Flight.js" },
  { value: "matestack", label: "Matestack" },
  { value: "voltstack", label: "VoltStack" },
  { value: "ion", label: "Ion.js" },
  { value: "pebble", label: "PebbleJS" },
  { value: "zen", label: "ZenJS" },
  { value: "pulse", label: "PulseJS" },
  { value: "aura", label: "AuraJS" },
  { value: "frame", label: "FrameJS" },
  { value: "glimmer", label: "Glimmer.js" },
  { value: "chubby", label: "ChubbyJS" },
  { value: "fuse", label: "Fuse.js" },
  { value: "tweak", label: "Tweak.js" },
  { value: "neutrino", label: "Neutrino" },
  { value: "jamstack", label: "Jamstack" },
  { value: "nitro", label: "Nitro.js" },
  { value: "nova", label: "NovaJS" },
  { value: "omega", label: "Omega.js" },
  { value: "delta", label: "Delta.js" },
  { value: "pluto", label: "Pluto.js" },
  { value: "orion", label: "OrionJS" },
  { value: "hydra", label: "HydraJS" },
  { value: "atlas", label: "Atlas.js" },
  { value: "phoenix", label: "Phoenix LiveView" },
  { value: "livewire", label: "Livewire" },
  { value: "turbo", label: "Turbo" },
  { value: "htmx", label: "HTMX" },
  { value: "alpinejs", label: "AlpineJS" },
  { value: "stimulus", label: "Stimulus" },
  { value: "liveviewjs", label: "LiveViewJS" },
  { value: "sprig", label: "Sprig" },
  { value: "unpoly", label: "Unpoly" },
  { value: "revel", label: "Revel" },
  { value: "vapor", label: "Vapor" },
  { value: "carbide", label: "CarbideJS" },
  { value: "spark", label: "Spark.js" },
  { value: "nova-lite", label: "Nova Lite" },
  { value: "trails", label: "Trails.js" },
  { value: "weld", label: "Weld.js" },
  { value: "arc", label: "Arc.js" },
  { value: "flare", label: "FlareJS" },
  { value: "vibe", label: "Vibe.js" }
];


export function ComboboxDemo() {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [search, setSearch] = React.useState("")
  
  // Only filter when there is a search term
  const filteredFrameworks =
    search.trim() === ""
      ? []
      : frameworks.filter((framework) =>
          framework.label.toLowerCase().includes(search.toLowerCase()) ||
          framework.value.toLowerCase().includes(search.toLowerCase())
        )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? frameworks.find((framework) => framework.value === value)?.label
            : "Select framework..."}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </DialogTrigger>
      <DialogContent className="p-0" showCloseButton={false}>
        <Command>
          <CommandInput
            placeholder="Search Notes..."
            className="h-9"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredFrameworks.length === 0 ? (
              <CommandEmpty>No results found.</CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredFrameworks.map((framework, index) => (
                  <CommandItem
                    key={index}
                    value={framework.value}
                    onSelect={(currentValue) => {
                      setValue(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    {framework.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
