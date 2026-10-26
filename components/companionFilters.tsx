"use client";

import { useDebouncedCallback } from "use-debounce";
import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, SlidersHorizontal } from "lucide-react";
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
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TEXT = {
  pt: {
    sort: "Ordenar por preço",
    noSort: "Sem ordenar",
    asc: "Preço: Menor para Maior",
    desc: "Preço: Maior para menor",
    search: "Procure sugars pelo nome...",
    filters: "Filtros",
    panelTitle: "Filtros de pesquisa",
    clear: "Limpar filtros",
    apply: "Aplicar filtros",
    gender: "Género",
    age: "Idade",
    height: "Altura",
    weight: "Peso",
    features: "Características",
    hair: "Cor do Cabelo",
    show: "Ver resultados",
    min: "Mínimo",
    max: "Máximo",
  },
  en: {
    sort: "Sort by price",
    noSort: "No sorting",
    asc: "Price: low to high",
    desc: "Price: high to low",
    search: "Search escorts by name...",
    filters: "Filters",
    panelTitle: "Search filters",
    clear: "Clear filters",
    apply: "Apply filters",
    gender: "Gender",
    age: "Age",
    height: "Height",
    weight: "Weight",
    features: "Features",
    hair: "Hair colour",
    show: "Show results",
    min: "Minimum",
    max: "Maximum",
  },
} as const;

/**
 * Sem parâmetro no endereço, a página abre em feminino, por isso é esse que
 * aparece escolhido. "Todos" grava o valor `todos` em vez de apagar o
 * parâmetro: apagá-lo voltaria a cair no feminino, e a opção ficava sem efeito.
 */
const GENEROS = [
  { valor: "feminino", pt: "Mulheres", en: "Women" },
  { valor: "trans", pt: "Trans", en: "Trans" },
  { valor: "masculino", pt: "Homens", en: "Men" },
  { valor: "todos", pt: "Todos", en: "All" },
] as const;

/** Faixas dos deslizadores; o endereço guarda "min-max" (por exemplo, age=20-30). */
const FAIXAS = {
  age: { min: 18, max: 60, unidade: { pt: "anos", en: "years" } },
  height: { min: 150, max: 190, unidade: { pt: "cm", en: "cm" } },
  weight: { min: 45, max: 100, unidade: { pt: "kg", en: "kg" } },
} as const;

/** Rótulos das características; o valor gravado no endereço não muda. */
const CARACTERISTICAS = [
  { chave: "silicone", pt: "Silicone", en: "Silicone" },
  { chave: "tattoos", pt: "Tatuagens", en: "Tattoos" },
  { chave: "smoker", pt: "Fumadora", en: "Smoker" },
] as const;

/** Cores do cabelo: o filtro grava o nome português em minúsculas. */
const CORES = [
  { nome: "Preto", en: "Black" },
  { nome: "Loiro", en: "Blonde" },
  { nome: "Castanho", en: "Brown" },
  { nome: "Vermelho", en: "Red" },
  { nome: "Branco", en: "White" },
  { nome: "Cinza", en: "Grey" },
  { nome: "Colorido", en: "Dyed" },
] as const;

/** Filtros por aplicar. As faixas podem vir do endereço como texto ou do deslizador como par. */
type Pendentes = Record<string, string | number[] | null | undefined>;

/** Contam para o número no botão "Filtros". O género só conta fora do feminino, que é o de omissão. */
const FILTROS_CONTADOS = ["age", "height", "weight", "silicone", "tattoos", "smoker", "hairColor"];

/**
 * "20-30" (do endereço) ou [20, 30] (do deslizador) passa a [20, 30]; sem
 * valor, a faixa inteira. Antes o texto do endereço ia direito para o
 * deslizador, que espera dois números, e a janela de filtros partia depois de
 * aplicar uma faixa.
 */
function faixa(valor: unknown, padrao: readonly [number, number]): [number, number] {
  if (Array.isArray(valor) && valor.length === 2) {
    return [Number(valor[0]), Number(valor[1])];
  }
  if (typeof valor === "string") {
    const [a, b] = valor.split("-").map(Number);
    if (Number.isFinite(a) && Number.isFinite(b)) return [a, b];
  }
  return [padrao[0], padrao[1]];
}

const DualSlider = ({
  value,
  onValueChange,
  min,
  max,
  rotulos,
}: {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  rotulos: { min: string; max: string };
}) => {
  const thumb =
    "block h-5 w-5 rounded-full border-2 border-rose-600 bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  return (
    <SliderPrimitive.Root
      className="relative flex w-full touch-none select-none items-center py-1"
      value={value}
      onValueChange={onValueChange}
      max={max}
      min={min}
      step={1}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
        <SliderPrimitive.Range className="absolute h-full bg-rose-600" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className={thumb} aria-label={rotulos.min} />
      <SliderPrimitive.Thumb className={thumb} aria-label={rotulos.max} />
    </SliderPrimitive.Root>
  );
};

/** Botão de escolha, em vez de uma lista que é preciso abrir. */
function Pilula({
  ativa,
  onClick,
  children,
}: {
  ativa: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={ativa}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
        ativa
          ? "border-rose-600 bg-rose-600 text-white"
          : "border-input bg-background text-foreground hover:border-rose-400",
      )}
    >
      {children}
    </button>
  );
}

function Secao({
  titulo,
  valor,
  children,
}: {
  titulo: string;
  valor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold">{titulo}</p>
        {valor && <span className="text-sm text-muted-foreground">{valor}</span>}
      </div>
      {children}
    </div>
  );
}

/** Os campos dos filtros, iguais no painel aberto e na janela. */
function CamposFiltro({
  pendentes,
  alterar,
  locale,
}: {
  pendentes: Pendentes;
  alterar: (chave: string, valor: string | number[] | null) => void;
  locale: Locale;
}) {
  const t = TEXT[locale];
  const genero = String(pendentes.gender || "feminino").toLowerCase();
  const cores = String(pendentes.hairColor || "").split(",");

  return (
    <div className="space-y-6">
      <Secao titulo={t.gender}>
        <div className="grid grid-cols-2 gap-2">
          {GENEROS.map((g) => (
            <Pilula key={g.valor} ativa={genero === g.valor} onClick={() => alterar("gender", g.valor)}>
              {g[locale]}
            </Pilula>
          ))}
        </div>
      </Secao>

      {(["age", "height", "weight"] as const).map((chave) => {
        const limites = FAIXAS[chave];
        const valor = faixa(pendentes[chave], [limites.min, limites.max]);
        return (
          <Secao
            key={chave}
            titulo={t[chave]}
            valor={`${valor[0]} – ${valor[1]} ${limites.unidade[locale]}`}
          >
            <DualSlider
              value={valor}
              onValueChange={(novo) => alterar(chave, novo)}
              min={limites.min}
              max={limites.max}
              rotulos={{ min: `${t[chave]}: ${t.min}`, max: `${t[chave]}: ${t.max}` }}
            />
          </Secao>
        );
      })}

      <Secao titulo={t.features}>
        <div className="flex flex-wrap gap-2">
          {CARACTERISTICAS.map((c) => {
            const ativa = pendentes[c.chave] === "true";
            return (
              <Pilula key={c.chave} ativa={ativa} onClick={() => alterar(c.chave, ativa ? null : "true")}>
                {c[locale]}
              </Pilula>
            );
          })}
        </div>
      </Secao>

      <Secao titulo={t.hair}>
        <div className="flex flex-wrap gap-2">
          {CORES.map((cor) => (
            <Pilula
              key={cor.nome}
              ativa={cores.includes(cor.nome.toLowerCase())}
              onClick={() => alterar("hairColor", cor.nome.toLowerCase())}
            >
              {locale === "en" ? cor.en : cor.nome}
            </Pilula>
          ))}
        </div>
      </Secao>
    </div>
  );
}

/**
 * Filtros da lista de acompanhantes.
 *
 * - `dialog` (página inicial): ordenação, pesquisa e o botão "Filtros", que
 *   abre os campos numa janela.
 * - `sidebar` (distritos e /companions): os campos ficam abertos num painel
 *   ao lado da lista, a partir de ecrãs largos. Devolve o painel e a barra de
 *   ordenação e pesquisa como irmãos, para a página os pôr na grelha (painel à
 *   esquerda, barra por cima da lista). Em ecrãs estreitos o painel não cabe
 *   ao lado, e fica o botão "Filtros" com a janela.
 */
export function CompanionFilters({
  initialFilters,
  layout = "dialog",
}: {
  initialFilters: FilterTypesCompanions;
  layout?: "dialog" | "sidebar";
}) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = TEXT[locale];
  const [, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const [searchValue, setSearchValue] = useState(
    searchParams?.get("search") || "",
  );

  const [pendingFilters, setPendingFilters] = useState<Pendentes>(
    initialFilters as Pendentes,
  );

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
      });
    });
  }, 300);

  const createQueryString = (params: Pendentes) => {
    const current = new URLSearchParams(searchParams?.toString());

    current.set("page", "1");

    Object.entries(params).forEach(([key, value]) => {
      // Filtros novos começam na primeira página: a página que vinha nos
      // filtros iniciais não pode voltar a escrever por cima.
      if (key === "page") return;
      if (value === null || value === undefined || value === "") {
        current.delete(key);
      } else if (Array.isArray(value)) {
        current.set(key, `${value[0]}-${value[1]}`);
      } else {
        current.set(key, value.toString());
      }
    });

    return current.toString();
  };

  const updateFilters = (filters: Pendentes) => {
    const queryString = createQueryString(filters);
    window.location.href = `?${queryString}`;
    setIsOpen(false);
  };

  const handleSort = (value: string | null) => {
    updateFilters({
      ...pendingFilters,
      sort: value ? `price-${value}` : null,
    });
  };

  const handlePendingFilter = (key: string, value: string | number[] | null) => {
    setPendingFilters((prev) => {
      if (key === "hairColor") {
        const currentColors = String(prev.hairColor || "")
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
        }
        currentColors.push(value as string);
        return { ...prev, [key]: currentColors.join(",") };
      }
      return { ...prev, [key]: value };
    });
  };

  const applyFilters = () => {
    updateFilters(pendingFilters);
  };

  /** Volta à lista sem filtros nenhuns (no distrito, isso é o feminino). */
  const clearFilters = () => {
    window.location.href = window.location.pathname;
  };

  const activeFiltersCount =
    FILTROS_CONTADOS.filter((chave) => {
      const valor = pendingFilters[chave];
      return valor !== null && valor !== undefined && valor !== "";
    }).length +
    (pendingFilters.gender && pendingFilters.gender !== "feminino" ? 1 : 0);

  const campos = (
    <CamposFiltro pendentes={pendingFilters} alterar={handlePendingFilter} locale={locale} />
  );

  const barra = (
    <div className="mb-6 flex items-center justify-between gap-3">
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
        className="hidden w-full max-w-xs rounded-full border border-primary bg-background p-2 px-4 md:block"
        value={searchValue}
        onChange={handleSearch}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            className={cn("rounded-full", layout === "sidebar" && "lg:hidden")}
          >
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
            <DialogTitle className="text-lg font-semibold">{t.filters}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-6">{campos}</div>
          </ScrollArea>
          <div className="flex items-center gap-3 p-6 border-t">
            <Button variant="ghost" onClick={clearFilters}>
              {t.clear}
            </Button>
            <Button onClick={applyFilters} className="flex-1 bg-rose-600 text-white hover:bg-rose-700">
              {t.show}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (layout === "dialog") return barra;

  return (
    <>
      <aside className="hidden lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:block lg:self-start lg:sticky lg:top-24">
        <div className="rounded-2xl border bg-card p-5 shadow-sm lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="mb-5 flex items-center justify-between gap-2">
            <p className="flex items-center gap-2 text-base font-bold">
              <SlidersHorizontal className="h-5 w-5 text-rose-600" />
              {t.panelTitle}
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm font-medium text-rose-600 underline underline-offset-2 hover:text-rose-700"
            >
              {t.clear}
            </button>
          </div>
          {campos}
          <Button
            onClick={applyFilters}
            className="mt-6 h-11 w-full rounded-xl bg-rose-600 text-base font-semibold text-white hover:bg-rose-700"
          >
            {t.apply}
          </Button>
        </div>
      </aside>
      <div className="lg:col-start-2 lg:row-start-1">{barra}</div>
    </>
  );
}
