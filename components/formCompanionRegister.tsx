"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Form,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { City } from "@/db/schema";
import { updateCompanionFromForm } from "@/db/queries/companions";
import { IMaskInput } from "react-imask";
import { isValidPhoneNumber } from "react-phone-number-input";
import { PhoneInput } from "./phoneInput";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useUser } from "@clerk/nextjs";
import { FileUpload } from "@/components/ui/file-upload";
import {
  uploadImage,
  getImagesByAuthId,
  deleteImage,
  updateImagesOrder,
  updateImageFraming,
} from "@/db/queries/images";
import { PhotoSortableGrid, type ManagedImage } from "@/components/photoSortableGrid";
import { ImageFramingDialog } from "@/components/imageFramingDialog";
import { mediaFraming } from "@/lib/image-framing";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { registerCompanionAction } from "@/app/actions/register";
import { saveRegistrationContact } from "@/app/companions/register/action";
import { CompletarPerfilFields } from "@/components/registo/completar-perfil-fields";
import { PassosRegisto } from "@/components/registo/passos-registo";
import {
  CAMPOS_COMPLETAR,
  CAMPOS_INFORMACOES,
  CAMPOS_LOCALIZACAO,
  completarPerfilSchema,
  edicaoPerfilSchema,
  informacoesSchema,
  localizacaoSchema,
  registoNovoSchema,
  termosSchema,
  type RegisterCompanionFormValues,
} from "@/lib/registo-schema";

// O tipo vive com os esquemas (lib/registo-schema), que o servidor também usa.
export type { RegisterCompanionFormValues };

/**
 * Registo novo: os três passos que criam o perfil (o 4 e o 5 têm página
 * própria). Edição: os mesmos, mais o resto do perfil, que no registo é o
 * passo 5.
 */
const SECCOES_REGISTO = ["Informações", "Localização", "Fotos"] as const;
const SECCOES_EDICAO = ["Informações", "Localização", "Fotos", "Sobre si e características"] as const;
const PAGINA_FOTOS = 2;

/** Campos dos passos 1 e 2 que ficam guardados no navegador se ela sair a meio. */
const CAMPOS_RASCUNHO = [
  "name",
  "phoneNumber",
  "description",
  "price",
  "age",
  "gender",
  "city",
  "state",
  "country",
  "neighborhood",
  "meets_at_hotel",
  "meets_at_own_place",
] as const;

const chaveRascunho = (userId: string) => `onesugar:registo-rascunho:${userId}`;

/** Os passos 1 e 2, para saber se mudaram depois de o perfil ser criado. */
const passosBase = (valores: Partial<RegisterCompanionFormValues>) =>
  JSON.stringify(CAMPOS_RASCUNHO.map((campo) => valores[campo] ?? null));

interface RegisterCompanionFormProps {
  cities: City[];
  companionData?:
  | (RegisterCompanionFormValues & { companionId: number })
  | null
  | undefined;
  maxPhotos?: number;
  /**
   * Valores que a utilizadora já introduziu antes de chegar aqui (ex.: na
   * calculadora pública). Só se aplicam a um registo novo — nunca sobrepõem
   * dados de um perfil existente em edição.
   */
  prefill?: { phoneNumber?: string; price?: number };
  /** Perfil verificado: pode comprar plano (e por isso fazer upgrade de fotos). */
  planosDisponiveis?: boolean;
}

export function RegisterCompanionForm({
  cities,
  companionData,
  maxPhotos = 10,
  prefill,
  planosDisponiveis = false,
}: RegisterCompanionFormProps) {
  const emEdicao = Boolean(companionData);
  const formSections = emEdicao ? SECCOES_EDICAO : SECCOES_REGISTO;

  const [currentPage, setCurrentPage] = React.useState(0);
  const [uploadStatus, setUploadStatus] = React.useState("");
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [images, setImages] = React.useState<ManagedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageToFrame, setImageToFrame] = useState<ManagedImage | null>(null);
  const [isSavingFraming, setIsSavingFraming] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { getToken } = useAuth();

  const scrollToTop = () => {
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  // Nome e telemóvel já enviados ao RD com sucesso, para não repetir a chamada
  // sempre que ela sai do campo ou volta atrás e avança outra vez.
  const lastSentContactRef = React.useRef<string | null>(null);

  /**
   * Leva o telemóvel (e o nome, se já estiver escrito) ao RD antes de existir
   * perfil, que é o que permite voltar a falar com quem desiste a meio do
   * registo. Corre quando o telemóvel fica válido, ao passar o passo 1 e, por
   * segurança, na criação do perfil.
   *
   * Só marca como enviado depois de a chamada correr bem. Assim, se uma
   * tentativa falhar, a seguinte repete-a em vez de a dar por feita — e quando
   * correu bem, as seguintes não fazem nada.
   */
  const syncRegistrationContact = () => {
    const { name, phoneNumber } = form.getValues();
    if (!phoneNumber || !isValidPhoneNumber(phoneNumber)) return;

    const contact = `${name ?? ""}|${phoneNumber}`;
    if (lastSentContactRef.current === contact) return;

    void saveRegistrationContact(name ?? "", phoneNumber)
      .then(() => {
        lastSentContactRef.current = contact;
      })
      .catch(() => { });
  };

  const schemaDaPagina = (page: number) => {
    if (page === 0) return emEdicao ? informacoesSchema : informacoesSchema.merge(termosSchema);
    if (page === 1) return localizacaoSchema;
    if (emEdicao && page === 3) return completarPerfilSchema;
    return null;
  };

  const validateCurrentPage = async () => {
    const schema = schemaDaPagina(currentPage);
    if (!schema) return true;
    const result = await schema.safeParseAsync(form.getValues());
    return result.success;
  };

  const handleNextPage = async () => {
    const isValid = await validateCurrentPage();
    if (isValid) {
      // A primeira etapa é a que tem nome e telemóvel. Só em registo novo:
      // na edição o perfil já existe e o contacto já está sincronizado.
      if (!emEdicao && currentPage === 0) {
        syncRegistrationContact();
      }

      setCurrentPage((prev) => prev + 1);
      scrollToTop();
    } else {
      form.trigger();
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => prev - 1);
    scrollToTop();
  };

  /**
   * Na edição o perfil já está todo preenchido, então saltar direto para a
   * etapa que se quer mexer não exige revalidar as anteriores. No cadastro
   * inicial continua a ser passo a passo, porque aí os dados ainda não existem.
   */
  const handleJumpToPage = (page: number) => {
    if (!emEdicao) return;
    setCurrentPage(page);
    scrollToTop();
  };

  /** Em que etapa vive cada campo, para poder levar a anunciante até ao erro. */
  const fieldToPage: Record<string, number> = {
    ...Object.fromEntries(CAMPOS_INFORMACOES.map((f) => [f, 0])),
    aceitouTermos: 0,
    ...Object.fromEntries(CAMPOS_LOCALIZACAO.map((f) => [f, 1])),
    ...(emEdicao ? Object.fromEntries(CAMPOS_COMPLETAR.map((f) => [f, 3])) : {}),
  };

  /**
   * Guardar a partir de qualquer etapa só funciona se um campo inválido noutra
   * etapa não fizer o formulário falhar em silêncio: sem isto, carregar em
   * guardar na aba das fotos não fazia nada visível quando o erro estava, por
   * exemplo, no concelho. Assim o formulário leva-a até ao campo em falta.
   */
  const handleInvalidSubmit = (errors: Record<string, unknown>) => {
    const firstField = Object.keys(errors)[0];
    const page = firstField !== undefined ? fieldToPage[firstField] : undefined;

    if (page !== undefined && page !== currentPage) {
      setCurrentPage(page);
      scrollToTop();
    }

    toast({
      variant: "destructive",
      title: "Falta preencher um campo",
      description:
        page !== undefined
          ? `Verifique a etapa "${formSections[page]}" antes de guardar.`
          : "Verifique os campos assinalados antes de guardar.",
    });
  };

  const getInitialValues = (): RegisterCompanionFormValues => {
    if (companionData) {
      return {
        ...companionData,
        phoneNumber: companionData.phoneNumber || "",
        neighborhood: companionData.neighborhood || "",
        state: companionData.state || "",
        country: companionData.country || "",
        meets_at_hotel: companionData.meets_at_hotel || false,
        meets_at_own_place: companionData.meets_at_own_place || false,
      };
    }
    // Registo novo: só os passos 1 e 2. O resto (passo 5) começa vazio e não
    // com valores de exemplo, que ficavam gravados como se fossem dela.
    return {
      name: "",
      phoneNumber: prefill?.phoneNumber ?? "",
      description: "",
      price: prefill?.price ?? 0,
      age: 18,
      gender: "",
      aceitouTermos: false,
      neighborhood: "",
      city: 0,
      state: "",
      country: "",
      meets_at_hotel: false,
      meets_at_own_place: false,
      languages: [],
      silicone: false,
      tattoos: false,
      piercings: false,
      smoker: false,
    };
  };

  const form = useForm<RegisterCompanionFormValues>({
    resolver: zodResolver(emEdicao ? edicaoPerfilSchema : registoNovoSchema),
    defaultValues: getInitialValues(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });
  const { isLoaded, user } = useUser();

  React.useEffect(() => {
    if (companionData && isLoaded && user?.id) {
      getImagesByAuthId(user.id).then(setImages);
    }
  }, [companionData, isLoaded, user?.id]);

  // Rascunho dos passos 1 e 2: se ela fechar o site antes das fotos, o que
  // escreveu volta quando regressar. Fica só neste navegador. A caixa dos 18
  // anos e dos termos fica de fora: tem de ser marcada outra vez.
  React.useEffect(() => {
    if (emEdicao || !isLoaded || !user?.id) return;
    const chave = chaveRascunho(user.id);

    try {
      const guardado = window.localStorage.getItem(chave);
      if (guardado) {
        const rascunho = JSON.parse(guardado) as Partial<RegisterCompanionFormValues>;
        const valores = { ...form.getValues() };
        for (const campo of CAMPOS_RASCUNHO) {
          if (rascunho[campo] !== undefined) {
            (valores as Record<string, unknown>)[campo] = rascunho[campo];
          }
        }
        // O que veio da calculadora é mais recente do que o rascunho.
        if (prefill?.phoneNumber) valores.phoneNumber = prefill.phoneNumber;
        if (prefill?.price) valores.price = prefill.price;
        form.reset(valores);
      }
    } catch {
      // Sem acesso ao armazenamento (janela privada, bloqueio): segue sem rascunho.
    }

    let espera: ReturnType<typeof setTimeout> | undefined;
    const subscricao = form.watch((valores) => {
      clearTimeout(espera);
      espera = setTimeout(() => {
        try {
          const rascunho = Object.fromEntries(
            CAMPOS_RASCUNHO.map((campo) => [campo, valores[campo]]),
          );
          window.localStorage.setItem(chave, JSON.stringify(rascunho));
        } catch {
          // Idem: o rascunho é uma conveniência, não pode partir o registo.
        }
      }, 500);
    });

    return () => {
      clearTimeout(espera);
      subscricao.unsubscribe();
    };
    // O formulário e o prefill não mudam depois de montados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emEdicao, isLoaded, user?.id]);

  const apagarRascunho = () => {
    if (!user?.id) return;
    try {
      window.localStorage.removeItem(chaveRascunho(user.id));
    } catch {
      // Sem acesso ao armazenamento: não havia rascunho para apagar.
    }
  };

  const [companionId, setCompanionId] = React.useState<number | null>(
    companionData?.companionId ?? null,
  );
  // Passos 1 e 2 tal como estavam quando o perfil foi criado (primeira foto).
  // Se ela voltar atrás e mudar alguma coisa, isso é gravado ao continuar.
  const passosNaCriacaoRef = React.useRef<string | null>(null);

  const handleFileUpload = async (files: File[]) => {
    if (!files.length) return;

    if (images.length >= maxPhotos) {
      toast({
        variant: "destructive",
        title: "Limite de ficheiros atingido",
        description: `O teu plano permite no máximo ${maxPhotos} fotos e vídeos.`,
      });
      return;
    }

    const allowedCount = maxPhotos - images.length;
    const filesToUpload = files.slice(0, allowedCount);
    if (filesToUpload.length < files.length) {
      toast({
        title: "Alguns ficheiros não foram enviados",
        description: `Só podias adicionar mais ${allowedCount} ficheiro${allowedCount !== 1 ? "s" : ""} (limite de ${maxPhotos}).`,
        variant: "destructive",
      });
    }

    setUploadStatus("Enviando arquivos...");

    try {
      let currentCompanionId = companionId;

      // Registo novo: o perfil é criado na primeira foto, e é aqui que entra
      // na fila do admin.
      if (!currentCompanionId) {
        setIsRegistering(true);
        const formData = form.getValues();
        try {
          const companion = await registerCompanionAction(formData);
          currentCompanionId = companion.id;
          setCompanionId(companion.id);
          passosNaCriacaoRef.current = passosBase(formData);
          apagarRascunho();
          // A conta passou a ter o registo de base feito (metadados no
          // Clerk): pede uma sessão nova para o proxy já o saber.
          await getToken({ skipCache: true }).catch(() => null);
          // Rede de segurança: no percurso normal isto não faz nada, porque o
          // contacto já foi no passo 1. Só age se aquela chamada tiver falhado.
          syncRegistrationContact();
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Falha no registro",
            description:
              error instanceof Error ? error.message : "Algo deu errado",
          });
          setUploadStatus("");
          setIsRegistering(false);
          return;
        } finally {
          setIsRegistering(false);
        }
      }

      if (!currentCompanionId) {
        throw new Error("Companion ID not found");
      }

      // NOW upload images with the companionId
      const results = await Promise.all(
        filesToUpload.map((file) => uploadImage(file, currentCompanionId)),
      );

      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        setUploadStatus(`Falha ao enviar ${errors.length} arquivos`);
        toast({
          title: "Falha no upload",
          description: `Falha ao enviar ${errors.length} arquivos`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Imagens enviadas",
          description: `${files.length} imagens enviadas com sucesso`,
          variant: "success",
        });
      }

      if (isLoaded && user?.id) {
        const newImages = await getImagesByAuthId(user.id);
        setImages(newImages);
      }
      setUploadStatus("");
    } catch (error) {
      toast({
        title: "Falha no upload",
        description: error instanceof Error ? error.message : "Algo deu errado",
        variant: "destructive",
      });
      setUploadStatus("");
    }
  };

  const toggleImageSelection = (storagePath: string) => {
    setSelectedImages((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(storagePath)) {
        newSelection.delete(storagePath);
      } else {
        newSelection.add(storagePath);
      }
      return newSelection;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.size === 0) return;

    const imagesToDelete = Array.from(selectedImages);
    // Filter using storagePath
    setImages((prev) =>
      prev.filter((img) => !selectedImages.has(img.storagePath)),
    );
    setSelectedImages(new Set());
    setIsDeleting(true);

    try {
      await Promise.all(
        imagesToDelete.map((storagePath) => deleteImage(storagePath)),
      );
      toast({
        title: "Images deleted",
        description: `Successfully deleted ${imagesToDelete.length} images`,
        variant: "success",
      });
    } catch (error) {
      // On error, restore the images
      if (isLoaded && user?.id) {
        const newImages = await getImagesByAuthId(user.id);
        setImages(newImages);
      }
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteImage = async (storagePath: string) => {
    // Optimistically remove the image
    setImages((prev) => prev.filter((img) => img.storagePath !== storagePath));

    try {
      await deleteImage(storagePath);
      toast({
        title: "Image deleted",
        description: "Your image has been deleted successfully",
        variant: "success",
      });
    } catch (error) {
      if (isLoaded && user?.id) {
        const newImages = await getImagesByAuthId(user.id);
        setImages(newImages);
      }
      toast({
        title: "Delete failed",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (nextImages: ManagedImage[]) => {
    const previousOrder = images;
    // Mostra já a nova ordem e só depois confirma com o servidor, para o
    // arrasto não parecer preso à espera da resposta.
    setImages(nextImages);

    const result = await updateImagesOrder(
      nextImages.map((image) => image.storagePath),
    );

    if (!result.success) {
      setImages(previousOrder);
      toast({
        title: "Não foi possível guardar a ordem",
        description: result.error ?? "Tenta novamente.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Ordem guardada",
      description: "A primeira foto é a capa do teu perfil.",
      variant: "success",
    });
  };

  const handleSaveFraming = async (framing: {
    focalX: number;
    focalY: number;
    zoom: number;
  }) => {
    if (!imageToFrame) return;

    const target = imageToFrame;
    setIsSavingFraming(true);

    const result = await updateImageFraming(target.storagePath, framing);

    setIsSavingFraming(false);

    if (!result.success) {
      toast({
        title: "Não foi possível guardar o enquadramento",
        description: result.error ?? "Tenta novamente.",
        variant: "destructive",
      });
      return;
    }

    setImages((prev) =>
      prev.map((image) =>
        image.storagePath === target.storagePath
          ? { ...image, ...framing }
          : image,
      ),
    );
    setImageToFrame(null);
    toast({
      title: "Enquadramento guardado",
      description: "A foto original não foi alterada.",
      variant: "success",
    });
  };

  async function onSubmit(data: RegisterCompanionFormValues) {
    if (!emEdicao) {
      // O perfil já foi criado na primeira foto: falta só seguir para a
      // verificação (passo 4).
      if (images.length === 0) {
        toast({
          variant: "destructive",
          title: "Fotos obrigatórias",
          description:
            "Por favor, adicione pelo menos uma foto antes de continuar.",
        });
        return;
      }

      // Voltou atrás depois da primeira foto e mudou o nome, o distrito...:
      // o perfil foi criado com os valores de então, por isso grava-se agora.
      if (passosNaCriacaoRef.current && passosNaCriacaoRef.current !== passosBase(data)) {
        try {
          await updateCompanionFromForm(data);
          passosNaCriacaoRef.current = passosBase(data);
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Falha ao guardar",
            description: error instanceof Error ? error.message : "Algo deu errado",
          });
          return;
        }
      }

      router.push("/companions/verification");
      return;
    }
    try {
      const { pendingReview, reenviado } = await updateCompanionFromForm(data);
      await user?.reload();
      toast({
        variant: "success",
        title: reenviado
          ? "Perfil reenviado"
          : pendingReview
            ? "Alterações enviadas"
            : "Perfil Atualizado",
        description: reenviado
          ? "A equipa vai voltar a analisar o seu perfil."
          : pendingReview
            ? "O seu anúncio continua no ar com a versão aprovada. As alterações, incluindo fotos novas, aparecem assim que forem revistas."
            : "Seu perfil foi atualizado com sucesso.",
      });
      router.refresh();
      router.push("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falha na atualização",
        description: error instanceof Error ? error.message : "Algo deu errado",
      });
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {!emEdicao && <PassosRegisto atual={(currentPage + 1) as 1 | 2 | 3} />}
      {emEdicao && (
        <div className="mx-auto max-w-3xl mb-4">
          <p className="text-sm text-muted-foreground mb-2">
            Salte para a etapa que quer alterar. Pode guardar a partir de
            qualquer uma.
          </p>
          <nav className="flex flex-wrap gap-2">
            {formSections.map((section, index) => (
              <Button
                key={section}
                type="button"
                variant={currentPage === index ? "default" : "outline"}
                size="sm"
                onClick={() => handleJumpToPage(index)}
                aria-current={currentPage === index ? "step" : undefined}
              >
                <span className="mr-1.5 text-xs opacity-70">{index + 1}</span>
                {section}
              </Button>
            ))}
          </nav>
        </div>
      )}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
          className="mx-auto max-w-3xl"
        >
          <Card id="form-fields">
            <CardHeader>
              <CardTitle>
                {emEdicao ? "Editar perfil" : formSections[currentPage]}
              </CardTitle>
              <CardDescription>
                {emEdicao
                  ? "Edite os seus detalhes."
                  : currentPage === PAGINA_FOTOS
                    ? "O seu perfil é criado com a primeira foto e segue logo para a nossa equipa."
                    : "Só o essencial. O resto do perfil pode completar no fim."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações (passo 1) */}
              {currentPage === 0 && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Ana Carolina" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Numero de Telefone</FormLabel>
                          <FormControl>
                            <PhoneInput
                              defaultCountry={"PT"}
                              placeholder="Insira seu numero de telefone"
                              value={field.value}
                              onChange={(value) => field.onChange(value)}
                              onBlur={() => {
                                field.onBlur();
                                // O número vai para o RD logo que é válido,
                                // sem esperar pelo resto do passo.
                                if (!emEdicao) syncRegistrationContact();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Conte um pouco sobre você e o que gosta."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (por hora)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IMaskInput
                                mask="num"
                                blocks={{
                                  num: {
                                    mask: Number,
                                    scale: 2,
                                    min: 0,
                                    max: 10000,
                                    radix: ",",
                                    thousandsSeparator: ".",
                                  },
                                }}
                                placeholder="Insira seu preço cobrado"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-7 py-2 text-sm ring-offset-background"
                                value={String(field.value)}
                                onAccept={(value) =>
                                  field.onChange(
                                    Number(value.replace(/[^0-9]/g, "")),
                                  )
                                }
                              />
                              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                                €
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idade</FormLabel>
                          <Select
                            onValueChange={(value) =>
                              field.onChange(Number.parseInt(value, 10))
                            }
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione sua idade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 22 }, (_, i) => i + 18).map(
                                (age) => (
                                  <SelectItem key={age} value={age.toString()}>
                                    {age}
                                  </SelectItem>
                                ),
                              )}
                              <SelectItem value="40">40+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gênero</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value ?? ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione seu gênero" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Masculino">
                              Masculino
                            </SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
                            <SelectItem value="Trans">Trans</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!emEdicao && (
                    <FormField
                      control={form.control}
                      name="aceitouTermos"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-lg border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value === true}
                              onCheckedChange={(marcado) => field.onChange(marcado === true)}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-snug">
                            <FormLabel className="font-normal">
                              Declaro que tenho 18 anos ou mais e aceito os{" "}
                              <Link
                                href="/termos-e-condicoes"
                                target="_blank"
                                className="underline underline-offset-2"
                              >
                                Termos e Condições
                              </Link>{" "}
                              e a{" "}
                              <Link
                                href="/politica-de-privacidade"
                                target="_blank"
                                className="underline underline-offset-2"
                              >
                                Política de Privacidade
                              </Link>
                              .
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              {/* Localização (passo 2) */}
              {currentPage === 1 && (
                <div className="space-y-4">
                  {emEdicao && <h3 className="text-lg font-semibold">Localização</h3>}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distrito</FormLabel>
                        <Select
                          onValueChange={(selected) => {
                            field.onChange(Number(selected));

                            const selectedCity = cities.find(
                              (c) => c.id === Number(selected),
                            );

                            if (selectedCity) {
                              form.setValue("state", selectedCity.state, {
                                shouldValidate: false,
                                shouldDirty: true,
                                shouldTouch: false,
                              });
                              form.setValue("country", selectedCity.country, {
                                shouldValidate: false,
                                shouldDirty: true,
                                shouldTouch: false,
                              });
                            }
                          }}
                          value={field.value ? String(field.value) : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione seu distrito" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cities.map((city) => (
                              <SelectItem key={city.id} value={String(city.id)}>
                                {city.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="neighborhood"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Concelho</FormLabel>
                        <FormControl>
                          <Input placeholder="Digite seu concelho" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="meets_at_hotel"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Atende em Hotel
                            </FormLabel>
                            <FormDescription>
                              Você atende clientes em hotéis?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="meets_at_own_place"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Atende em Local Próprio
                            </FormLabel>
                            <FormDescription>
                              Você atende clientes em seu local?
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Fotos (passo 3) */}
              {currentPage === PAGINA_FOTOS && (
                <div className="space-y-4">
                  {isRegistering && (
                    <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <p className="text-sm text-muted-foreground">
                        A criar o seu perfil...
                      </p>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-neutral-500">
                      Adicione fotos e vídeos para que os clientes possam conhecer
                      melhor.
                    </p>
                    <span className={`text-sm font-medium ${images.length >= maxPhotos ? "text-destructive" : "text-neutral-500"}`}>
                      {images.length}/{maxPhotos}
                    </span>
                  </div>

                  {images.length > 0 && (
                    <>
                      <div className="flex justify-between items-center mb-4">
                        <p className="text-sm">
                          {selectedImages.size === 0
                            ? null
                            : selectedImages.size}{" "}
                          {selectedImages.size === 0
                            ? null
                            : selectedImages.size === 1
                              ? "imagem selecionada"
                              : "imagens selecionadas"}
                        </p>
                        {selectedImages.size > 0 && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting}
                              >
                                {isDeleting ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deletando...
                                  </>
                                ) : (
                                  <>Deletar Selecionadas</>
                                )}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Você tem certeza?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Essa ação não pode ser desfeita.{" "}
                                  {selectedImages.size}{" "}
                                  {selectedImages.size === 1
                                    ? "imagem será"
                                    : "imagens serão"}{" "}
                                  permanentemente removidas.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteSelected}
                                >
                                  Deletar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Arrasta as fotos para mudar a ordem. A primeira é a capa
                        do teu perfil. No ícone de recorte podes escolher que
                        parte da foto fica visível.
                        {emEdicao &&
                          " Aqui as alterações são guardadas automaticamente, não precisas de carregar em guardar."}
                      </p>
                      <PhotoSortableGrid
                        images={images}
                        selected={selectedImages}
                        onToggleSelect={toggleImageSelection}
                        onReorder={handleReorder}
                        onRequestDelete={setImageToDelete}
                        onEditFraming={setImageToFrame}
                      />

                      <AlertDialog
                        open={imageToDelete !== null}
                        onOpenChange={(open) => {
                          if (!open) setImageToDelete(null);
                        }}
                      >
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Você tem certeza?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Essa ação não pode ser desfeita. O arquivo será
                              permanentemente removido.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                if (imageToDelete) {
                                  handleDeleteImage(imageToDelete);
                                  setImageToDelete(null);
                                }
                              }}
                            >
                              Deletar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <ImageFramingDialog
                        open={imageToFrame !== null}
                        onOpenChange={(open) => {
                          if (!open) setImageToFrame(null);
                        }}
                        imageUrl={imageToFrame?.publicUrl ?? null}
                        initialFraming={
                          imageToFrame
                            ? mediaFraming(imageToFrame)
                            : { focalX: 50, focalY: 50, zoom: 100 }
                        }
                        isSaving={isSavingFraming}
                        onSave={handleSaveFraming}
                      />
                    </>
                  )}

                  {images.length < maxPhotos ? (
                    <FileUpload onChange={handleFileUpload} />
                  ) : (
                    <p className="text-sm text-center text-muted-foreground border border-dashed border-border rounded-lg py-6">
                      Limite de {maxPhotos} ficheiros atingido.
                      {maxPhotos === 10 &&
                        (planosDisponiveis ? (
                          " Faz upgrade para o plano Classic para adicionar até 30 fotos."
                        ) : (
                          <>
                            {" "}
                            <Link
                              href="/companions/verification"
                              className="underline underline-offset-2"
                            >
                              Verifica o teu perfil
                            </Link>{" "}
                            para poderes fazer upgrade e adicionar até 30 fotos.
                          </>
                        ))}
                    </p>
                  )}
                  {uploadStatus && (
                    <p className="text-sm text-red-500">{uploadStatus}</p>
                  )}
                </div>
              )}

              {/* Sobre si e características (só na edição; no registo é o passo 5) */}
              {emEdicao && currentPage === 3 && <CompletarPerfilFields />}
            </CardContent>
            <CardFooter className="flex flex-wrap justify-between gap-2">
              {currentPage > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={isRegistering}
                >
                  Anterior
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                {currentPage < formSections.length - 1 && (
                  <Button
                    type="button"
                    variant={emEdicao ? "outline" : "default"}
                    onClick={handleNextPage}
                    disabled={isRegistering || form.formState.isSubmitting}
                  >
                    Próximo
                  </Button>
                )}
                {/* Na edição dá para guardar de qualquer etapa; no registo o
                    botão só aparece nas fotos, onde o perfil já existe. */}
                {(emEdicao || currentPage === formSections.length - 1) && (
                  <Button
                    type="submit"
                    disabled={
                      form.formState.isSubmitting ||
                      isRegistering ||
                      (!emEdicao && images.length === 0)
                    }
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {emEdicao ? "Atualizando..." : "A continuar..."}
                      </>
                    ) : emEdicao ? (
                      "Guardar alterações"
                    ) : (
                      "Continuar para a verificação"
                    )}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
}
