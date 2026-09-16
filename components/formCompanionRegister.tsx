"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
import { Cigarette, Globe, Loader2, X } from "lucide-react";
import { City } from "@/db/schema"; // Import Companion
import {
  registerCompanion,
  updateCompanionFromForm,
} from "@/db/queries/companions"; // Import updateCompanion
import { IMaskInput } from "react-imask";
import { PhoneInput } from "./phoneInput";
import { useRouter } from "next/navigation"; // Import useRouter
import { useToast } from "@/hooks/use-toast"; // Import at the correct path
import { useClerk, useUser } from "@clerk/nextjs";
import { MultiSelect } from "./multi-select";
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
import Image from "next/image";
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
import { cn } from "@/lib/utils";
import { IconBrandInstagram, IconLanguage } from "@tabler/icons-react";
import { registerCompanionAction } from "@/app/actions/register";
import { completeFirstStepRegistration } from "@/app/companions/register/action";
import { EarningsCalculator } from "@/components/earnings-calculator";

const pageOneSchema = z.object({
  // Companion Info
  name: z.string().min(2, "Nome precisa ter ao menos 2 caractéres"),
  shortDescription: z
  .string()
  .max(150, "Descrição curta pode ter no máximo 150 caractéres")
  .optional()
  .or(z.literal("")),
  phoneNumber: z
    .string()
    .min(8, "Numero de telefone precisa ter ao menos 8 caractéres"),
  instagramHandle: z.string().optional(),
  description: z
    .string()
    .min(30, "Descrição precisa ter ao menos 30 caractéres")
    .max(500, "Descrição não pode ter mais de 500 caractéres"),
  price: z.number().min(1, "Seu preço precisa ser positivo"),
  age: z.number().min(18, "Você precisa ter mais de 18 anos!").max(100),
  gender: z.string().min(1, "Gênero é obrigatório"),
  gender_identity: z.string().optional(),
  languages: z.array(z.string()).min(1, "Selecione ao menos uma Lingua"),
});

const pageTwoSchema = z.object({
  // Characteristics
  weight: z.number().min(30, "Peso precisa ser ao menos 30kg"),
  height: z
    .number()
    .min(1.3, "Altura precisa ser ao menos 1.40m")
    .max(3.0, "Altura precisa ser menor que 2.5m"),
  ethnicity: z.string().min(1, "Etnia é obrigatória"),
  eye_color: z.string().optional(),
  hair_color: z.string().min(1, "Cor do seu cabelo é obrigatória"),
  hair_length: z.string().optional(),
  shoe_size: z.number().optional(),
  silicone: z.boolean().default(false),
  tattoos: z.boolean().default(false),
  piercings: z.boolean().default(false),
  smoker: z.boolean().optional(),
});

const pageThreeSchema = z.object({
  // Location
  neighborhood: z.string().min(1, "Concelho é obrigatório"),
  city: z.number().min(1, "Cidade é obrigatória"),
  state: z.string().length(2, "Estado precisa conter ao menos 2 caractéres"),
  country: z.string().min(1, "País é obrigatório"),
  meets_at_hotel: z.boolean().default(false),
  meets_at_own_place: z.boolean().default(false),
});

const RegisterCompanionFormSchema = z.object({
  ...pageOneSchema.shape,
  ...pageTwoSchema.shape,
  ...pageThreeSchema.shape,
});

// Updated type to include email (if you need it) and remove undefined
export type RegisterCompanionFormValues = z.infer<
  typeof RegisterCompanionFormSchema
> & {
  email?: string; // Make email optional
};

const formSections = [
  "Suas Informações",
  "Características",
  "Localização",
  "Fotos",
] as const;

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
}

export function RegisterCompanionForm({
  cities,
  companionData,
  maxPhotos = 10,
  prefill,
}: RegisterCompanionFormProps) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const [uploadStatus, setUploadStatus] = React.useState("");
  const [isRegistering, setIsRegistering] = React.useState(false);
  const [images, setImages] = React.useState<ManagedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [imageToFrame, setImageToFrame] = useState<ManagedImage | null>(null);
  const [isSavingFraming, setIsSavingFraming] = useState(false);
  const linguasDisponiveis = [
    { value: "Português", label: "Português" },
    { value: "Inglês", label: "Inglês" },
    { value: "Espanhol", label: "Espanhol" },
    { value: "Francês", label: "Francês" },
    { value: "Alemão", label: "Alemão" },
    { value: "Italiano", label: "Italiano" },
  ];
  const { toast } = useToast();
  const router = useRouter();

  const scrollToTop = () => {
    window.scrollTo({ top: 100, behavior: "smooth" });
  };

  const validateCurrentPage = async () => {
    const values = form.getValues();
    companionData ? setCompanionId(companionData?.companionId) : null;

    try {
      if (currentPage === 0) {
        await pageOneSchema.parseAsync(values);
        return true;
      }
      if (currentPage === 1) {
        await pageTwoSchema.parseAsync(values);
        return true;
      } else if (currentPage === 2) {
        await pageThreeSchema.parseAsync(values);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const handleNextPage = async () => {
    const isValid = await validateCurrentPage();
    if (isValid) {
      // Just move to next page - don't create account yet
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
    if (!companionData) return;
    setCurrentPage(page);
    scrollToTop();
  };

  /** Em que etapa vive cada campo, para poder levar a anunciante até ao erro. */
  const fieldToPage: Record<string, number> = {
    ...Object.fromEntries(Object.keys(pageOneSchema.shape).map((f) => [f, 0])),
    ...Object.fromEntries(Object.keys(pageTwoSchema.shape).map((f) => [f, 1])),
    ...Object.fromEntries(Object.keys(pageThreeSchema.shape).map((f) => [f, 2])),
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
        price: companionData.price, // Assuming price is a number
        age: companionData.age, // Assuming age is a number
        weight: companionData.weight, // Assuming weight is a number
        height: companionData.height, // Assuming height is a number
        shoe_size: companionData.shoe_size ?? 36, // Provide default if null
        languages: companionData.languages, // Assuming languages is an array of strings
        instagramHandle: companionData.instagramHandle, // Instagram handle is a string
        city: companionData.city, // City is an id
        phoneNumber: companionData.phoneNumber || "", // Provide default if null
        ethnicity: companionData.ethnicity || "", // Provide default if null
        hair_color: companionData.hair_color || "", // Provide default if null
        silicone: companionData.silicone || false, // Provide default if null
        tattoos: companionData.tattoos || false, // Provide default if null
        piercings: companionData.piercings || false, // Provide default if null
        smoker: companionData.smoker || false, // Provide default if null
        neighborhood: companionData.neighborhood || "", // Provide default if null
        state: companionData.state || "", // Provide default if null
        country: companionData.country || "", // Provide default if null
        meets_at_hotel: companionData.meets_at_hotel || false,
        meets_at_own_place: companionData.meets_at_own_place || false,
      };
    } else {
      return {
        name: "",
        shortDescription: "",
        phoneNumber: prefill?.phoneNumber ?? "",
        description: "",
        instagramHandle: "",
        price: prefill?.price ?? 0,
        age: 18,
        gender: "",
        gender_identity: "",
        languages: ["Português"],
        weight: 60,
        height: 1.6,
        ethnicity: "Branco",
        eye_color: "Castanho",
        hair_color: "Castanho",
        hair_length: "Médio",
        shoe_size: 36,
        silicone: false,
        tattoos: false,
        piercings: false,
        smoker: false,
        neighborhood: "",
        city: 0,
        state: "",
        country: "",
        meets_at_hotel: false,
        meets_at_own_place: false,
      };
    }
  };

  const form = useForm<RegisterCompanionFormValues>({
    resolver: zodResolver(RegisterCompanionFormSchema),
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

  const [companionId, setCompanionId] = React.useState<number | null>(null);

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

      // For new users without companionData, create companion FIRST
      if (!companionData && !companionId) {
        setIsRegistering(true);
        const formData = form.getValues();
        try {
          const companion = await registerCompanionAction(formData);
          currentCompanionId = companion.id;
          setCompanionId(companion.id);
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

      // For existing users, use their companionId
      if (companionData && !currentCompanionId) {
        currentCompanionId = companionData.companionId;
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

  async function onSubmit(data: RegisterCompanionFormValues & { id?: number }) {
    if (!companionData) {
      // Validate that at least one photo has been uploaded
      if (images.length === 0) {
        toast({
          variant: "destructive",
          title: "Fotos obrigatórias",
          description:
            "Por favor, adicione pelo menos uma foto antes de finalizar o cadastro.",
        });
        return;
      }

      await user?.reload();

      // Companion already created during photo upload, just redirect
      await completeFirstStepRegistration();
      router.push("/companions/verification");
      return;
    }
    try {
      const clerkId = user?.id;
      if (!clerkId) {
        throw new Error("User ID not found");
      }
      const { pendingReview } = await updateCompanionFromForm(clerkId, data);
      await user?.reload();
      toast({
        variant: "success",
        title: pendingReview ? "Alterações enviadas" : "Perfil Atualizado",
        description: pendingReview
          ? "O seu anúncio continua no ar com a versão aprovada. As alterações, incluindo fotos novas, aparecem assim que forem revistas."
          : "Seu perfil foi atualizado com sucesso.",
      });
      await completeFirstStepRegistration();
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
      {!companionData && currentPage === 0 && (
        <div className="mx-auto max-w-3xl mb-8">
          <EarningsCalculator
            cta={
              <button
                type="button"
                onClick={() =>
                  document.getElementById("form-fields")?.scrollIntoView({ behavior: "smooth" })
                }
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Criar o meu perfil de Sugar gratuitamente
              </button>
            }
          />
        </div>
      )}
      {companionData && (
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
                {companionData ? "Edit Profile" : "Registre-se"}
              </CardTitle>
              <CardDescription>
                {companionData
                  ? "Edite seu detalhes."
                  : "Insira seus detalhes e apareça na melhor plataforma de sugars de portugal."}
              </CardDescription>
              {/* Só faz sentido no cadastro inicial: quem já tem perfil e vem
                  editar já passou pela verificação e não precisa do tutorial. */}
              {!companionData && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">
                    Exemplo de como gravar seu vídeo:
                  </p>
                  <div className="w-full aspect-video">
                    <iframe
                      className="w-full h-full rounded-lg border shadow-sm"
                      src="https://www.youtube-nocookie.com/embed/m5Tja4hJMXQ?autoplay=1&controls=0&mute=0&loop=1&playlist=m5Tja4hJMXQ&modestbranding=1&showinfo=0&rel=0"
                      title="Vídeo de verificação"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Page One (Suas Informações) */}
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
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="instagramHandle"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>
                            <div className="flex items-center mt-1 gap-x-2">
                              <IconBrandInstagram className="w-4 h-4" />
                              Instagram
                            </div>
                          </FormLabel>
                          <FormControl className="pt-1">
                            <div className="flex">
                              <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted">
                                @
                              </div>
                              <Input
                                className="rounded-l-none"
                                placeholder="seu_instagram"
                                value={
                                  field.value
                                    ? field.value.replace("@", "")
                                    : ""
                                }
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.replace("@", ""),
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição curta</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Escreva uma descrição curta para aparecer no seu perfil. É extremamente importante."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Essa é sua descrição mais detalhada. Conte um pouco mais sobre você e o que gosta."
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

                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gênero</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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
                    <FormField
                      control={form.control}
                      name="gender_identity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Identidade de gênero</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Cisgênero" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Cisgênero">
                                Cisgênero
                              </SelectItem>
                              <SelectItem value="Transgênero">
                                Transgênero
                              </SelectItem>
                              <SelectItem value="Outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="languages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Línguas
                        </FormLabel>
                        <FormControl>
                          <MultiSelect
                            options={[
                              { value: "Português", label: "Português" },
                              { value: "Inglês", label: "Inglês" },
                              { value: "Espanhol", label: "Espanhol" },
                              { value: "Francês", label: "Francês" },
                              { value: "Alemão", label: "Alemão" },
                              { value: "Italiano", label: "Italiano" },
                            ]}
                            onValueChange={field.onChange}
                            value={field.value}
                            defaultValue={
                              companionData
                                ? companionData.languages
                                : ["Português"]
                            }
                            placeholder="Selecione suas Línguas"
                            variant="inverted"
                            animation={2}
                            maxCount={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              {/* Page Two (Características) */}
              {currentPage === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Características</h3>
                  <p className=" text-sm text-neutral-500 ">
                    Essa parte é muito importante para aparecer nos nossos
                    filtros e atrair novos clientes.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="weight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peso (kg)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Insira seu peso"
                              value={field.value?.toString() || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number.parseFloat(e.target.value)
                                    : 0,
                                )
                              }
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Altura (m)</FormLabel>
                          <FormControl>
                            <IMaskInput
                              mask="0,99"
                              definitions={{
                                "0": /[1-2]/, // First digit: only 1-2
                                "9": /[0-9]/, // Other digits: 0-9
                              }}
                              placeholder="1,70"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={
                                field.value?.toString().replace(".", ",") || ""
                              }
                              onAccept={(value: string) => {
                                const numericValue = Number(
                                  value.replace(",", "."),
                                );
                                if (
                                  !isNaN(numericValue) &&
                                  numericValue >= 1.3 &&
                                  numericValue <= 2.5
                                ) {
                                  field.onChange(numericValue);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ethnicity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Etnia</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione sua etnia" />
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
                      control={form.control}
                      name="eye_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor do olho</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione sua cor de olhos" />
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
                      control={form.control}
                      name="hair_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor do cabelo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Castanho" />
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
                      control={form.control}
                      name="hair_length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tamanho do Cabelo</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue
                                  placeholder="Tamanho do seu cabelo"
                                  defaultValue="Médio"
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Curto">Curto</SelectItem>
                              <SelectItem value="Médio">Médio</SelectItem>
                              <SelectItem value="Longo">Longo</SelectItem>
                              <SelectItem value="Muito Longo">
                                Muito Longo
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shoe_size"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tamanho do pé (EU)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder=""
                              value={field.value?.toString() || ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number.parseFloat(e.target.value)
                                    : 0,
                                )
                              }
                              className="w-full"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="silicone"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex flex-row gap-2">
                              Silicone
                            </FormLabel>
                            <FormDescription>
                              Você possui procedimentos de silicone?
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
                      name="tattoos"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex flex-row gap-2">
                              Tattoos{" "}
                            </FormLabel>
                            <FormDescription>
                              Você tem tatuagens?
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
                      name="piercings"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex flex-row gap-2">
                              Piercings
                            </FormLabel>
                            <FormDescription>
                              Você tem piercings?
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
                      name="smoker"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base flex flex-row gap-2">
                              Fumante
                            </FormLabel>
                            <FormDescription>Você fuma? </FormDescription>
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

              {/* Page Three (Localização) */}
              {currentPage === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Localização</h3>
                  {isRegistering && (
                    <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <p className="text-sm text-muted-foreground">
                        Registrando seu perfil...
                      </p>
                    </div>
                  )}
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
                          value={String(field.value)}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder="Selecione seu distrito"
                                defaultValue={
                                  cities.find((c) => c.id === field.value)
                                    ?.city || ""
                                }
                              />
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

              {/* Page Four (Suas Fotos) */}
              {currentPage === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Suas Fotos</h3>
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
                        {companionData &&
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
                      {maxPhotos === 10 && " Faz upgrade para o plano Classic para adicionar até 30 fotos."}
                    </p>
                  )}
                  {uploadStatus && (
                    <p className="text-sm text-red-500">{uploadStatus}</p>
                  )}
                </div>
              )}
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
                    variant={companionData ? "outline" : "default"}
                    onClick={handleNextPage}
                    disabled={isRegistering || form.formState.isSubmitting}
                  >
                    {currentPage === 2 && isRegistering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Registrando perfil...
                      </>
                    ) : (
                      "Próximo"
                    )}
                  </Button>
                )}
                {/* Na edição dá para guardar de qualquer etapa; no cadastro
                    inicial o botão continua só no fim, porque o perfil ainda
                    está a ser construído de raiz. */}
                {(companionData || currentPage === formSections.length - 1) && (
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting || isRegistering}
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {companionData ? "Atualizando..." : "Registrando..."}
                      </>
                    ) : companionData ? (
                      "Guardar alterações"
                    ) : (
                      "Registrar"
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
