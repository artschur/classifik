"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { CompanionsList } from "./companionsList"
import { Filter, SortAsc, X } from "lucide-react"
import type { CompanionFiltered, FilterTypesCompanions } from "@/types/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CompanionsListSkeleton } from "./companionsList"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { useTransition } from "react"

interface FilterProps {
  companions: CompanionFiltered[]
  city: string
  currentFilters: FilterTypesCompanions
}

const DualSlider = ({
  value,
  onValueChange,
  min,
  max,
}: {
  value: number[]
  onValueChange: (value: number[]) => void
  min: number
  max: number
}) => {
  return (
    <SliderPrimitive.Root
      className="relative flex w-full touch-none select-none items-center"
      value={value}
      onValueChange={onValueChange}
      max={max}
      min={min}
      step={1}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  )
}

export function CompanionFilters({ companions, city, currentFilters }: FilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isOpen, setIsOpen] = useState(false)
  const [pendingFilters, setPendingFilters] =
    useState< FilterTypesCompanions> (currentFilters)


  const createQueryString = (params: Record<string, string | number | number[] | null>) => {
    const current = new URLSearchParams(searchParams.toString())
    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "") {
        current.delete(key)
      } else if (Array.isArray(value)) {
        current.set(key, `${value[0]}-${value[1]}`)
      } else {
        current.set(key, value.toString())
      }
    })
    return current.toString()
  }

  const updateFilters = (filters: Record<string, string | number | number[] | null>) => {
    const queryString = createQueryString(filters)
    startTransition(() => {
      router.push(`${city}?${queryString}`, { scroll: false })
    })
    setIsOpen(false)
  }

  const handleSort = (value: string | null) => {
    updateFilters({ ...pendingFilters, sort: value ? `price-${value}` : null, silicone: pendingFilters.silicone?.toString() || null, tattoos: pendingFilters.tattoos?.toString() || null, smoker: pendingFilters.smoker?.toString() || null })
  }

  const handlePendingFilter = (key: string, value: string | number | number[] | null) => {
    setPendingFilters((prev) => {
      if (key === "hairColor") {
        const currentColors = ((prev.hairColor as string) || "").split(",").filter(Boolean)
        if (!value) {
          return { ...prev, [key]: null }
        }
        if (currentColors.includes(value as string)) {
          const newColors = currentColors.filter((c) => c !== value)
          return { ...prev, [key]: newColors.length ? newColors.join(",") : null }
        } else {
          currentColors.push(value as string)
          return { ...prev, [key]: currentColors.join(",") }
        }
      }
      return { ...prev, [key]: value }
    })
  }

  const applyFilters = () => {
    const filtersWithStrings = Object.fromEntries(
      Object.entries(pendingFilters).map(([key, value]) => [key, typeof value === 'boolean' ? value.toString() : value])
    )
    updateFilters(filtersWithStrings)
  }

  return (
    <div>
      <div className="flex w-full justify-between items-center h-32">
        <Select
          value={searchParams.get("sort")?.split("-")[1] || undefined}
          onValueChange={(value) => handleSort(value || null)}
        >
          <SelectTrigger className="w-[100px] rounded-full">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="none">Sem ordem</SelectItem>
            <SelectItem value="asc">Preço: Menor para maior</SelectItem>
            <SelectItem value="desc">Preço: Maior para menor</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
              {Object.keys(pendingFilters).length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {Object.keys(pendingFilters).length}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-lg font-semibold">Filtros</DialogTitle>
              </div>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
              <div className="space-y-6 p-6">
                {/* Age Range */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Idade</h4>
                  <DualSlider
                    value={(pendingFilters.age as number[] | undefined) ?? [18, 60]}
                    onValueChange={(value) => handlePendingFilter("age", value)}
                    min={18}
                    max={60}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{(pendingFilters.age as number[] | undefined)?.[0] ?? 18}</span>
                    <span>{(pendingFilters.age as number[] | undefined)?.[1] ?? 60}</span>
                  </div>
                </div>

                {/* Characteristics */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Characteristics</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Silicone", "Tattoos", "Smoker"].map((char) => (
                      <Badge
                        key={char}
                        variant="outline"
                        className={`cursor-pointer ${
                          pendingFilters[char.toLowerCase() as keyof FilterTypesCompanions] === "true" ? "bg-primary text-primary-foreground" : ""
                        }`}
                        onClick={() =>
                          handlePendingFilter(
                            char.toLowerCase(),
                            pendingFilters[char.toLowerCase() as keyof FilterTypesCompanions] === "true" ? null : "true",
                          )
                        }
                      >
                        {char}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Cor do cabelo</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {["Preto", "Loiro", "Castanho", "Vermelho", "Outro"].map((color) => {
                      const selectedColors = (pendingFilters.hairColor as string || '').split(',');
                      const isSelected = selectedColors.includes(color.toLowerCase());
                      
                      return (
                        <Badge
                          key={color}
                          variant="outline"
                          className={`cursor-pointer text-base ${
                            isSelected ? "bg-primary text-primary-foreground" : ""
                          }`}
                          onClick={() =>
                            handlePendingFilter(
                              "hairColor",
                              color.toLowerCase()
                            )
                          }
                        >
                          {color}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
            {/* Apply Filters Button */}
            <div className="p-6 border-t">
              <Button onClick={applyFilters} className="w-full">
                Mostrar resultados
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      { isPending ? <CompanionsListSkeleton /> : <CompanionsList companions={companions} />}
    </div>
  )
}

