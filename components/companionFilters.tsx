"use client";

import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import type { FilterTypesCompanions } from "@/types/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { useLocale } from "@/components/locale-provider";

const TEXT = {
  pt: {
    sort: "Ordenar por preço",
    noSort: "Sem ordenar",
    asc: "Preço: Menor para Maior",
    desc: "Preço: Maior para menor",
    search: "Procure sugars pelo nome...",
    filters: "Filtros",
    gender: "Género",
    selectGender: "Selecione o género",
    all: "Todos",
    female: "Feminino",
    male: "Masculino",
    trans: "Trans",
    age: "Idade",
    height: "Altura (cm)",
    weight: "Peso (kg)",
    features: "Características",
    hair: "Cor do Cabelo",
    show: "Ver resultados",
  },
  en: {
    sort: "Sort by price",
    noSort: "No sorting",
    asc: "Price: low to high",
    desc: "Price: high to low",
    search: "Search escorts by name...",
    filters: "Filters",
    gender: "Gender",
    selectGender: "Select gender",
    all: "All",
    female: "Female",
    male: "Male",
    trans: "Trans",
    age: "Age",
    height: "Height (cm)",
    weight: "Weight (kg)",
    features: "Features",
    hair: "Hair colour",
    show: "Show results",
  },
} as const;

/** Rótulos das características; o valor gravado no endereço não muda. */
const CARACTERISTICAS: Record<string, { pt: string; en: string }> = {
  Silicone: { pt: "Silicone", en: "Silicone" },
  Tattoos: { pt: "Tatuagens", en: "Tattoos" },
  Smoker: { pt: "Fumadora", en: "Smoker" },
};

/** Cores do cabelo: o filtro grava o nome português em minúsculas. */
const CORES_EN: Record<string, string> = {
  Preto: "Black",
  Loiro: "Blonde",
  Castanho: "Brown",
  Vermelho: "Red",
  Branco: "White",
  Cinza: "Grey",
  Colorido: "Dyed",
};

const DualSlider = ({
  value,
  onValueChange,
  min,
  max,
}: {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
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
  );
};

export function CompanionFilters({
  initialFilters,
}: {
  initialFilters: FilterTypesCompanions;
}) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = TEXT[locale];
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const [searchValue, setSearchValue] = useState(
    searchParams?.get("search") || "",
  );

  const [pendingFilters, setPendingFilters] =
    useState<FilterTypesCompanions>(initialFilters);

  useEffect(() => {
    setSearchValue(searchParams?.get("search") || "");
  }, [searchParams]);

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  const debouncedSearch = useDebouncedCallback((value: string) => {
    // Use null for empty searches to clear the parameter
    const searchParam = value.trim() === "" ? null : value;

    setPendingFilters((prev) => ({
      ...prev,
      search: searchParam ?? undefined,
    }));

    startTransition(() => {
      updateFilters({
        ...pendingFilters,
        search: searchParam,
        silicone: pendingFilters.silicone?.toString() || null,
        tattoos: pendingFilters.tattoos?.toString() || null,
        smoker: pendingFilters.smoker?.toString() || null,
      });
    });
  }, 300);

  const createQueryString = (
    params: Record<string, string | number | number[] | null>,
  ) => {
    const current = new URLSearchParams(searchParams?.toString());

    current.set("page", "1");

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "") {
        current.delete(key);
      } else if (Array.isArray(value)) {
        current.set(key, `${value[0]}-${value[1]}`);
      } else {
        current.set(key, value.toString());
      }
    });

    return current.toString();
  };

  const updateFilters = (
    filters: Record<string, string | number | number[] | null>,
  ) => {
    const queryString = createQueryString(filters);
    window.location.href = `?${queryString}`;
    setIsOpen(false);
  };

  const handleSort = (value: string | null) => {
    updateFilters({
      ...pendingFilters,
      sort: value ? `price-${value}` : null,
      silicone: pendingFilters.silicone?.toString() || null,
      tattoos: pendingFilters.tattoos?.toString() || null,
      smoker: pendingFilters.smoker?.toString() || null,
    });
  };

  const handlePendingFilter = (
    key: string,
    value: string | number | number[] | null,
  ) => {
    setPendingFilters((prev) => {
      if (key === "hairColor") {
        const currentColors = ((prev.hairColor as string) || "")
          .split(",")
          .filter(Boolean);
        if (!value) {
          return { ...prev, [key]: null };
        }
        if (currentColors.includes(value as string)) {
          const newColors = currentColors.filter((c) => c !== value);
          return {
            ...prev,
            [key]: newColors.length ? newColors.join(",") : null,
          };
        } else {
          currentColors.push(value as string);
          return { ...prev, [key]: currentColors.join(",") };
        }
      }
      return { ...prev, [key]: value };
    });
  };

  const applyFilters = () => {
    const filtersWithStrings = Object.fromEntries(
      Object.entries(pendingFilters).map(([key, value]) => [
        key,
        typeof value === "boolean" ? value.toString() : value,
      ]),
    );
    updateFilters(filtersWithStrings);
  };

  const activeFiltersCount = Object.values(pendingFilters).filter(
    (value) => value !== null && value !== undefined && value !== "",
  ).length;

  return (
    <div className="mb-6 space-y-4">
      <div className="flex justify-between items-center">
        <Select
          value={searchParams?.get("sort")?.split("-")[1] || undefined}
          onValueChange={(value) => handleSort(value || null)}
        >
          <SelectTrigger className="w-[180px] rounded-full">
            <SelectValue placeholder={t.sort} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="none">{t.noSort}</SelectItem>
            <SelectItem value="asc">{t.asc}</SelectItem>
            <SelectItem value="desc">{t.desc}</SelectItem>
          </SelectContent>
        </Select>

        <input
          type="text"
          placeholder={t.search}
          className="w-3/12 rounded-full border-primary border px-4 p-2 bg-background hidden md:block"
          value={searchValue}
          onChange={handleSearch}
        />

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="rounded-full">
              {t.filters}
              <Filter className="mr-2 h-4 w-4" />
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden rounded-2xl">
            <DialogHeader className="px-6 py-4 border-b">
              <DialogTitle className="text-lg font-semibold">
                {t.filters}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
              <div className="space-y-6 p-6">
                {/* gender */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">{t.gender}</h4>
                  {/* Sem parâmetro no endereço, a página abre em feminino, por
                      isso é esse que o selector mostra. E "Todos" grava o
                      valor `todos` em vez de apagar o parâmetro: apagá-lo
                      voltaria a cair no feminino por omissão, e a opção ficava
                      sem efeito. */}
                  <Select
                    value={(pendingFilters.gender as string) || "feminino"}
                    onValueChange={(value) =>
                      handlePendingFilter("gender", value)
                    }
                  >
                    <SelectTrigger className="w-full rounded-xl">
                      <SelectValue placeholder={t.selectGender} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="todos">{t.all}</SelectItem>
                      <SelectItem value="feminino">{t.female}</SelectItem>
                      <SelectItem value="masculino">{t.male}</SelectItem>
                      <SelectItem value="trans">{t.trans}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Age Range */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">{t.age}</h4>
                  <DualSlider
                    value={
                      (pendingFilters.age as number[] | undefined) ?? [18, 60]
                    }
                    onValueChange={(value) => handlePendingFilter("age", value)}
                    min={18}
                    max={60}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {(pendingFilters.age as number[] | undefined)?.[0] ?? 18}
                    </span>
                    <span>
                      {(pendingFilters.age as number[] | undefined)?.[1] ?? 60}
                    </span>
                  </div>
                </div>

                {/* Height Range */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">{t.height}</h4>
                  <DualSlider
                    value={
                      (pendingFilters.height as number[] | undefined) ?? [
                        150, 190,
                      ]
                    }
                    onValueChange={(value) =>
                      handlePendingFilter("height", value)
                    }
                    min={150}
                    max={190}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {(pendingFilters.height as number[] | undefined)?.[0] ??
                        150}
                      cm
                    </span>
                    <span>
                      {(pendingFilters.height as number[] | undefined)?.[1] ??
                        190}
                      cm
                    </span>
                  </div>
                </div>

                {/* Weight Range */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">{t.weight}</h4>
                  <DualSlider
                    value={
                      (pendingFilters.weight as number[] | undefined) ?? [
                        45, 100,
                      ]
                    }
                    onValueChange={(value) =>
                      handlePendingFilter("weight", value)
                    }
                    min={45}
                    max={100}
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {(pendingFilters.weight as number[] | undefined)?.[0] ??
                        45}
                      kg
                    </span>
                    <span>
                      {(pendingFilters.weight as number[] | undefined)?.[1] ??
                        100}
                      kg
                    </span>
                  </div>
                </div>
                {/* Characteristics */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">{t.features}</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Silicone", "Tattoos", "Smoker"].map((char) => (
                      <Badge
                        key={char}
                        variant="outline"
                        className={`cursor-pointer ${
                          pendingFilters[
                            char.toLowerCase() as keyof FilterTypesCompanions
                          ] === "true"
                            ? "bg-primary text-primary-foreground"
                            : ""
                        }`}
                        onClick={() =>
                          handlePendingFilter(
                            char.toLowerCase(),
                            pendingFilters[
                              char.toLowerCase() as keyof FilterTypesCompanions
                            ] === "true"
                              ? null
                              : "true",
                          )
                        }
                      >
                        {CARACTERISTICAS[char][locale]}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Hair Color */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">{t.hair}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      "Preto",
                      "Loiro",
                      "Castanho",
                      "Vermelho",
                      "Branco",
                      "Cinza",
                      "Colorido",
                    ].map((color) => {
                      const selectedColors = (
                        (pendingFilters.hairColor as string) || ""
                      ).split(",");
                      const isSelected = selectedColors.includes(
                        color.toLowerCase(),
                      );

                      return (
                        <Badge
                          key={color}
                          variant="outline"
                          className={`cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                          onClick={() =>
                            handlePendingFilter(
                              "hairColor",
                              color.toLowerCase(),
                            )
                          }
                        >
                          {locale === "en" ? CORES_EN[color] : color}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-6 border-t">
              <Button onClick={applyFilters} className="w-full">
                {t.show}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
