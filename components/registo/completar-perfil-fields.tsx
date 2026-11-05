"use client";

import { useFormContext } from "react-hook-form";
import { IMaskInput } from "react-imask";
import { Globe } from "lucide-react";
import { IconBrandInstagram } from "@tabler/icons-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/multi-select";
import { useLocale } from "@/components/locale-provider";
import type { Locale } from "@/lib/i18n";
import { traduzirValor } from "@/lib/i18n-values";
import type { CompletarPerfilInput } from "@/lib/registo-schema";

const LINGUAS = ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano"];

// Valores gravados (sempre em português). Os que traduzirValor não cobre têm
// aqui a tradução de cada opção.
const IDENTIDADES = ["Cisgênero", "Transgênero", "Outro"];
const ETNIAS = ["Branco", "Negro", "Latino", "Asiático"];
const CORES_OLHOS = ["Azul", "Verde", "Marrom", "Preto"];
const CORES_CABELO = ["Loiro", "Castanho", "Preto", "Vermelho", "Cinza", "Branco", "Colorido"];
const COMPRIMENTOS_CABELO = ["Curto", "Médio", "Longo", "Muito Longo"];

const OPCOES_EN: Record<string, string> = {
  "Cisgênero": "Cisgender",
  "Transgênero": "Transgender",
  Outro: "Other",
  Curto: "Short",
  "Médio": "Medium",
  Longo: "Long",
  "Muito Longo": "Very long",
};

/** O texto de uma opção no idioma da página; o valor não muda. */
const rotulo = (valor: string, locale: Locale) =>
  locale === "en" ? (OPCOES_EN[valor] ?? traduzirValor(valor, locale)) : valor;

const TEXT = {
  pt: {
    sobreSi: "Sobre si",
    sobreSiAjuda: "Tudo opcional. Quanto mais completo, mais confiança transmite.",
    descricaoCurta: "Descrição curta",
    descricaoCurtaPlaceholder: "Uma frase que aparece no cartão do seu anúncio.",
    instagramPlaceholder: "seu_instagram",
    identidade: "Identidade de género",
    selecione: "Selecione",
    linguas: "Línguas",
    linguasPlaceholder: "Selecione as suas línguas",
    caracteristicas: "Características",
    caracteristicasAjuda: "É o que faz o seu anúncio aparecer nos filtros de quem procura.",
    peso: "Peso (kg)",
    pesoPlaceholder: "Ex.: 60",
    altura: "Altura (m)",
    etnia: "Etnia",
    corOlhos: "Cor dos olhos",
    corCabelo: "Cor do cabelo",
    comprimentoCabelo: "Comprimento do cabelo",
    calcado: "Número de calçado (EU)",
    calcadoPlaceholder: "Ex.: 37",
    interruptores: {
      silicone: { label: "Silicone", pergunta: "Tem procedimentos de silicone?" },
      tattoos: { label: "Tatuagens", pergunta: "Tem tatuagens?" },
      piercings: { label: "Piercings", pergunta: "Tem piercings?" },
      smoker: { label: "Fumadora", pergunta: "Fuma?" },
    },
  },
  en: {
    sobreSi: "About you",
    sobreSiAjuda: "All optional. The more complete your profile, the more trust it builds.",
    descricaoCurta: "Short description",
    descricaoCurtaPlaceholder: "One sentence shown on your listing card.",
    instagramPlaceholder: "your_instagram",
    identidade: "Gender identity",
    selecione: "Select",
    linguas: "Languages",
    linguasPlaceholder: "Select your languages",
    caracteristicas: "Features",
    caracteristicasAjuda: "This is what makes your listing show up in the filters clients use.",
    peso: "Weight (kg)",
    pesoPlaceholder: "e.g. 60",
    altura: "Height (m)",
    etnia: "Ethnicity",
    corOlhos: "Eye colour",
    corCabelo: "Hair colour",
    comprimentoCabelo: "Hair length",
    calcado: "Shoe size (EU)",
    calcadoPlaceholder: "e.g. 37",
    interruptores: {
      silicone: { label: "Silicone", pergunta: "Do you have silicone implants?" },
      tattoos: { label: "Tattoos", pergunta: "Do you have tattoos?" },
      piercings: { label: "Piercings", pergunta: "Do you have piercings?" },
      smoker: { label: "Smoker", pergunta: "Do you smoke?" },
    },
  },
} as const;

const INTERRUPTORES = ["silicone", "tattoos", "piercings", "smoker"] as const;

/** Campo numérico opcional: vazio fica `undefined`, e não 0. */
const numeroOuVazio = (texto: string) => (texto === "" ? undefined : Number(texto));

/**
 * Passo 5 do registo e separador "Sobre ti e características" da edição: tudo
 * opcional. Lê o formulário pelo contexto (o <Form> à volta), para servir os
 * dois formulários, que têm tipos diferentes mas os mesmos nomes de campo.
 */
export function CompletarPerfilFields() {
  const { control } = useFormContext<CompletarPerfilInput>();
  const locale = useLocale();
  const t = TEXT[locale];

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t.sobreSi}</h3>
          <p className="text-sm text-muted-foreground">
            {t.sobreSiAjuda}
          </p>
        </div>

        <FormField
          control={control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t.descricaoCurta}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t.descricaoCurtaPlaceholder}
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={control}
            name="instagramHandle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <span className="flex items-center gap-x-2">
                    <IconBrandInstagram className="w-4 h-4" />
                    Instagram
                  </span>
                </FormLabel>
                <FormControl>
                  <div className="flex">
                    <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted">
                      @
                    </div>
                    <Input
                      className="rounded-l-none"
                      placeholder={t.instagramPlaceholder}
                      value={field.value ? field.value.replace("@", "") : ""}
                      onChange={(e) => field.onChange(e.target.value.replace("@", ""))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="gender_identity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.identidade}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t.selecione} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {IDENTIDADES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {rotulo(v, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={control}
          name="languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t.linguas}
              </FormLabel>
              <FormControl>
                <MultiSelect
                  options={LINGUAS.map((l) => ({ value: l, label: rotulo(l, locale) }))}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                  placeholder={t.linguasPlaceholder}
                  variant="inverted"
                  animation={2}
                  maxCount={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t.caracteristicas}</h3>
          <p className="text-sm text-muted-foreground">
            {t.caracteristicasAjuda}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.peso}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={t.pesoPlaceholder}
                    value={field.value?.toString() ?? ""}
                    onChange={(e) => field.onChange(numeroOuVazio(e.target.value))}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.altura}</FormLabel>
                <FormControl>
                  <IMaskInput
                    mask="0,99"
                    definitions={{
                      "0": /[1-2]/,
                      "9": /[0-9]/,
                    }}
                    placeholder="1,70"
                    inputMode="decimal"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={field.value?.toString().replace(".", ",") ?? ""}
                    onAccept={(value: string) => {
                      if (value === "") {
                        field.onChange(undefined);
                        return;
                      }
                      const altura = Number(value.replace(",", "."));
                      if (!Number.isNaN(altura) && altura >= 1.3 && altura <= 2.5) {
                        field.onChange(altura);
                      }
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="ethnicity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.etnia}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.selecione} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ETNIAS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {rotulo(v, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="eye_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.corOlhos}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.selecione} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CORES_OLHOS.map((v) => (
                      <SelectItem key={v} value={v}>
                        {rotulo(v, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="hair_color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.corCabelo}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.selecione} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CORES_CABELO.map((v) => (
                      <SelectItem key={v} value={v}>
                        {rotulo(v, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="hair_length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.comprimentoCabelo}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t.selecione} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COMPRIMENTOS_CABELO.map((v) => (
                      <SelectItem key={v} value={v}>
                        {rotulo(v, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="shoe_size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.calcado}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder={t.calcadoPlaceholder}
                    value={field.value?.toString() ?? ""}
                    onChange={(e) => field.onChange(numeroOuVazio(e.target.value))}
                    onBlur={field.onBlur}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {INTERRUPTORES.map((name) => ({ name, ...t.interruptores[name] })).map(({ name, label, pergunta }) => (
            <FormField
              key={name}
              control={control}
              name={name}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{label}</FormLabel>
                    <FormDescription>{pergunta}</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
