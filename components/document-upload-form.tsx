"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getSignedUploadUrl,
  saveDocumentAfterUpload,
} from "@/app/actions/document-verification";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DocumentFormSchema = z.object({
  documentType: z.string().min(1, "Selecione um tipo de documento"),
  file: z
    .any()
    .refine((file) => file instanceof File, { message: "Envie um ficheiro válido" })
    .refine((file) => file.size <= MAX_FILE_SIZE, {
      message: "O ficheiro deve ter no máximo 5MB",
    }),
});

async function uploadDocumentToSupabase(
  file: File,
  documentType: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const fileExtension = file.name.split(".").pop() || "bin";
  const signedUrlResult = await getSignedUploadUrl(documentType, fileExtension);

  if (!signedUrlResult.success) {
    return { success: false, error: signedUrlResult.error ?? "Falha ao gerar URL de upload." };
  }

  const { signedUrl, storagePath } = signedUrlResult;

  const uploadResponse = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text().catch(() => "Erro desconhecido");
    return { success: false, error: `Erro no upload: ${errorText}` };
  }

  const saveResult = await saveDocumentAfterUpload(documentType, storagePath);
  if (!saveResult.success) {
    return { success: false, error: saveResult.error ?? "Falha ao guardar registo do documento." };
  }

  return { success: true };
}

export function DocumentUploadForm() {
  const { isLoaded, user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof DocumentFormSchema>>({
    resolver: zodResolver(DocumentFormSchema),
    defaultValues: { documentType: "" },
  });

  async function onSubmit(data: z.infer<typeof DocumentFormSchema>) {
    if (!isLoaded || !user?.id) {
      toast({ title: "Erro", description: "Utilizador não autenticado.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await uploadDocumentToSupabase(data.file, data.documentType);

      if (result.success) {
        toast({
          title: "Perfil criado com sucesso!",
          description: "Os seus documentos foram enviados e o perfil está a ser verificado pela nossa equipa.",
          variant: "success",
        });
        router.push("/companions/verification/pending");
      } else {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar o documento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight">Documento de Identificação</h1>
          <span className="bg-rose-600 text-white text-sm font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest shrink-0">
            Obrigatório
          </span>
        </div>
        <p className="text-xl font-semibold leading-snug text-foreground">
          Envie um documento oficial que possamos identificar que você tem idade mínima de 18 anos.
        </p>
      </div>

      {/* Accepted documents */}
      <div className="border-2 border-border rounded-xl p-6 space-y-3 bg-muted/40">
        <h2 className="text-lg font-bold">Documentos aceites:</h2>
        <ul className="space-y-2 text-base font-medium text-foreground/80">
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            Passaporte
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            Cartão de Cidadão (Portugal)
          </li>
          <li className="flex items-start gap-2">
            <span className="text-rose-500 mt-0.5 shrink-0">•</span>
            RG ou qualquer outro documento oficial que permita confirmar que você é maior de idade.
          </li>
        </ul>
      </div>

      {/* Privacy note */}
      <div className="border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/20 rounded-xl p-6 flex gap-4">
        <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="font-bold text-base text-amber-900 dark:text-amber-400">Observação</h3>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
            Solicitamos este requisito para segurança e evitarmos perfis falsificados, inclusive,
            evitando menores. Por isso, precisamos fazer este tipo de solicitação.
          </p>
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="documentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-bold">Tipo de Documento</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione o tipo de documento" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="passport">Passaporte</SelectItem>
                    <SelectItem value="id_card">Cartão de Cidadão / RG</SelectItem>
                    <SelectItem value="drivers_license">Carta de Condução / CNH</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="file"
            render={({ field: { onChange } }) => (
              <FormItem>
                <FormLabel className="text-base font-bold">Ficheiro (máx. 5MB)</FormLabel>
                <FormControl>
                  <Input
                    type="file"
                    ref={fileInputRef}
                    className="h-12 text-base cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        onChange(file);
                        if (file.size > MAX_FILE_SIZE) {
                          form.setError("file", { message: "O ficheiro deve ter no máximo 5MB" });
                        } else {
                          form.clearErrors("file");
                        }
                      }
                    }}
                    accept="image/jpeg,image/png,application/pdf"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Security notice */}
          <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 space-y-2">
            <p className="text-sm font-bold">
              A sua segurança é importante
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>Todos os dados enviados são encriptados e utilizados exclusivamente para o processo de verificação da sua conta.</li>
              <li>Nunca partilhamos as suas informações com terceiros.</li>
              <li>O nosso compromisso é garantir a sua privacidade, segurança e confidencialidade em todas as etapas da verificação.</li>
            </ul>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full text-base font-bold py-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                A enviar documento...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-5 w-5" />
                Enviar Documento
              </>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
