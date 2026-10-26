"use client";

import Link from "next/link";
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
import { completarPerfilSchema, type CompletarPerfilInput } from "@/lib/registo-schema";
import { CompletarPerfilFields } from "@/components/registo/completar-perfil-fields";

const FIM_DO_REGISTO = "/companions/verification/pending";

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
  const form = useForm<CompletarPerfilInput>({
    resolver: zodResolver(completarPerfilSchema),
    defaultValues: valoresIniciais,
    mode: "onBlur",
  });

  async function onSubmit(data: CompletarPerfilInput) {
    try {
      const { pendingReview } = await saveCompletarPerfil(data);
      toast({
        variant: "success",
        title: pendingReview ? "Enviado para revisão" : "Perfil completo",
        description: pendingReview
          ? "O seu anúncio já está no ar: estas informações aparecem assim que forem revistas."
          : "Guardámos as suas informações.",
      });
      router.push(FIM_DO_REGISTO);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Não foi possível guardar",
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Complete o seu perfil</CardTitle>
            <CardDescription>
              Nada aqui é obrigatório, e pode sempre voltar mais tarde pelo seu
              painel. Um perfil completo aparece em mais pesquisas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompletarPerfilFields />
          </CardContent>
          <CardFooter className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href={FIM_DO_REGISTO}>Fazer depois</Link>
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                "Concluir"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
