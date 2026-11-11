"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { saveCompletarPerfil } from "@/db/queries/companions";
import { esquemasRegisto, type CompletarPerfilInput } from "@/lib/registo-schema";
import { CompletarPerfilFields } from "@/components/registo/completar-perfil-fields";
import { LocaleLink } from "@/components/locale-link";
import { useLocale } from "@/components/locale-provider";
import { localizeHref } from "@/lib/i18n";

const FIM_DO_REGISTO = "/companions/verification/pending";

const TEXT = {
  pt: {
    enviadoRevisao: "Enviado para revisão",
    perfilCompleto: "Perfil completo",
    enviadoRevisaoDescricao:
      "O seu anúncio já está no ar: estas informações aparecem assim que forem revistas.",
    guardado: "Guardámos as suas informações.",
    naoGuardou: "Não foi possível guardar",
    tenteNovamente: "Tente novamente.",
    titulo: "Complete o seu perfil",
    descricao:
      "Nada aqui é obrigatório, e pode sempre voltar mais tarde pelo seu painel. Um perfil completo aparece em mais pesquisas.",
    depois: "Fazer depois",
    aGuardar: "A guardar...",
    concluir: "Concluir",
  },
  en: {
    enviadoRevisao: "Sent for review",
    perfilCompleto: "Profile complete",
    enviadoRevisaoDescricao:
      "Your listing is already live: this information appears as soon as it has been reviewed.",
    guardado: "We've saved your information.",
    naoGuardou: "We couldn't save your changes",
    tenteNovamente: "Please try again.",
    titulo: "Complete your profile",
    descricao:
      "Nothing here is required, and you can always come back later from your dashboard. A complete profile shows up in more searches.",
    depois: "Do it later",
    aGuardar: "Saving...",
    concluir: "Finish",
  },
} as const;

/**
 * Passo 5 do registo: o resto do perfil, tudo opcional. Grava directo
 * enquanto o perfil está por aprovar (o admin vê logo na fila); se já estiver
 * no ar, segue para revisão como as outras edições.
 */
export function CompletarPerfilForm({
  valoresIniciais,
}: {
  valoresIniciais: CompletarPerfilInput;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const locale = useLocale();
  const t = TEXT[locale];
  const form = useForm<CompletarPerfilInput>({
    resolver: zodResolver(esquemasRegisto(locale).completarPerfilSchema),
    defaultValues: valoresIniciais,
    mode: "onBlur",
  });

  async function onSubmit(data: CompletarPerfilInput) {
    try {
      const { pendingReview } = await saveCompletarPerfil(data);
      toast({
        variant: "success",
        title: pendingReview ? t.enviadoRevisao : t.perfilCompleto,
        description: pendingReview ? t.enviadoRevisaoDescricao : t.guardado,
      });
      router.push(localizeHref(FIM_DO_REGISTO, locale));
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.naoGuardou,
        description: error instanceof Error ? error.message : t.tenteNovamente,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>{t.titulo}</CardTitle>
            <CardDescription>{t.descricao}</CardDescription>
          </CardHeader>
          <CardContent>
            <CompletarPerfilFields />
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" asChild>
              <LocaleLink locale={locale} href={FIM_DO_REGISTO}>
                {t.depois}
              </LocaleLink>
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.aGuardar}
                </>
              ) : (
                t.concluir
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
