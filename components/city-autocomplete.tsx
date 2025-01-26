"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


interface CityAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    cities: { slug: string; name: string; }[];
}



export function CityAutocomplete({ value, onChange, cities }: CityAutocompleteProps) {
    const [open, setOpen] = React.useState(false);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                    {value ? cities.find((city) => city.slug === value)?.name : "Select city..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Search city..." />
                    <CommandList>
                        <CommandEmpty>No city found.</CommandEmpty>
                        <CommandGroup>
                            {cities.map((city) => (
                                <CommandItem
                                    key={city.slug}
                                    onSelect={() => {
                                        onChange(city.slug === value ? "" : city.name);
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn("mr-2 h-4 w-4", value === city.name ? "opacity-100" : "opacity-0")} />
                                    {city.slug}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

