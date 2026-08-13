"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { PlusCircle } from "lucide-react"
import type { ComponentType } from "react"

export interface FacetOption {
  label: string
  value: string
  icon?: ComponentType<{ className?: string }>
}

export const FacetedFilter = ({
  title,
  options,
  selected,
  counts,
  onChange,
}: {
  title: string
  options: FacetOption[]
  selected: string[]
  counts?: Record<string, number>
  onChange: (values: string[]) => void
}) => {
  const selectedSet = new Set(selected)

  const toggle = (value: string) => {
    const next = new Set(selectedSet)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    onChange(Array.from(next))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="size-4" />
          {title}

          {selectedSet.size > 0 ? (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />

              <Badge variant="neutral" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedSet.size}
              </Badge>

              <div className="hidden gap-1 lg:flex">
                {selectedSet.size > 2 ? (
                  <Badge variant="neutral" className="rounded-sm px-1 font-normal">
                    {selectedSet.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selectedSet.has(option.value))
                    .map((option) => (
                      <Badge
                        key={option.value}
                        variant="neutral"
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>

            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedSet.has(option.value)

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggle(option.value)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggle(option.value)}
                      className="mr-2"
                      aria-label={option.label}
                    />

                    {option.icon ? (
                      <option.icon className="mr-2 size-4 text-muted-foreground" />
                    ) : null}

                    <span>{option.label}</span>

                    {counts?.[option.value] !== undefined ? (
                      <span className="ml-auto font-mono text-xs text-muted-foreground">
                        {counts[option.value]}
                      </span>
                    ) : null}
                  </CommandItem>
                )
              })}
            </CommandGroup>

            {selectedSet.size > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className="cursor-pointer justify-center text-center"
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
