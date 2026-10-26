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
import type { CompletarPerfilInput } from "@/lib/registo-schema";

const LINGUAS = ["Português", "Inglês", "Espanhol", "Francês", "Alemão", "Italiano"];

/** Campo numérico opcional: vazio fica `undefined`, e não 0. */
const numeroOuVazio = (texto: string) => (texto === "" ? undefined : Number(texto));

/**
 * Passo 5 do registo e separador "Sobre ti e características" da edição: tudo
 * opcional. Lê o formulário pelo contexto (o <Form> à volta), para servir os
 * dois formulários, que têm tipos diferentes mas os mesmos nomes de campo.
 */
export function CompletarPerfilFields() {
  const { control } = useFormContext<CompletarPerfilInput>();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Sobre si</h3>
          <p className="text-sm text-muted-foreground">
            Tudo opcional. Quanto mais completo, mais confiança transmite.
          </p>
        </div>

        <FormField
          control={control}
          name="shortDescription"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição curta</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Uma frase que aparece no cartão do seu anúncio."
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
                      placeholder="seu_instagram"
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
                <FormLabel>Identidade de género</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Cisgênero">Cisgênero</SelectItem>
                    <SelectItem value="Transgênero">Transgênero</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
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
                Línguas
              </FormLabel>
              <FormControl>
                <MultiSelect
                  options={LINGUAS.map((l) => ({ value: l, label: l }))}
                  onValueChange={field.onChange}
                  value={field.value}
                  defaultValue={field.value}
                  placeholder="Selecione as suas línguas"
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
          <h3 className="text-lg font-semibold">Características</h3>
          <p className="text-sm text-muted-foreground">
            É o que faz o seu anúncio aparecer nos filtros de quem procura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={control}
            name="weight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Peso (kg)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex.: 60"
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
                <FormLabel>Altura (m)</FormLabel>
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
                <FormLabel>Etnia</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Branco">Branco</SelectItem>
                    <SelectItem value="Negro">Negro</SelectItem>
                    <SelectItem value="Latino">Latino</SelectItem>
                    <SelectItem value="Asiático">Asiático</SelectItem>
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
                <FormLabel>Cor dos olhos</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Azul">Azul</SelectItem>
                    <SelectItem value="Verde">Verde</SelectItem>
                    <SelectItem value="Marrom">Marrom</SelectItem>
                    <SelectItem value="Preto">Preto</SelectItem>
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
                <FormLabel>Cor do cabelo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Loiro">Loiro</SelectItem>
                    <SelectItem value="Castanho">Castanho</SelectItem>
                    <SelectItem value="Preto">Preto</SelectItem>
                    <SelectItem value="Vermelho">Vermelho</SelectItem>
                    <SelectItem value="Cinza">Cinza</SelectItem>
                    <SelectItem value="Branco">Branco</SelectItem>
                    <SelectItem value="Colorido">Colorido</SelectItem>
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
                <FormLabel>Comprimento do cabelo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Curto">Curto</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Longo">Longo</SelectItem>
                    <SelectItem value="Muito Longo">Muito Longo</SelectItem>
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
                <FormLabel>Número de calçado (EU)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ex.: 37"
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
          {(
            [
              { name: "silicone", label: "Silicone", pergunta: "Tem procedimentos de silicone?" },
              { name: "tattoos", label: "Tatuagens", pergunta: "Tem tatuagens?" },
              { name: "piercings", label: "Piercings", pergunta: "Tem piercings?" },
              { name: "smoker", label: "Fumadora", pergunta: "Fuma?" },
            ] as const
          ).map(({ name, label, pergunta }) => (
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
