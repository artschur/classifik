'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Cigarette, Loader2, X } from 'lucide-react';
import { City } from '@/db/schema'; // Import Companion
import {
  registerCompanion,
  updateCompanionFromForm,
} from '@/db/queries/companions'; // Import updateCompanion
import { IMaskInput } from 'react-imask';
import { PhoneInput } from './phoneInput';
import { useRouter } from 'next/navigation'; // Import useRouter
import { useToast } from '@/hooks/use-toast'; // Import at the correct path
import { useUser } from '@clerk/nextjs';
import { MultiSelect } from './multi-select';

const pageOneSchema = z.object({
  // Companion Info
  name: z.string().min(2, 'Nome precisa ter ao menos 2 caractéres'),
  shortDescription: z
    .string()
    .min(10, 'Descrição curta precisa ter ao menos 10 caractéres')
    .max(60, 'Descrição curta pode ter no máximo 60 caractéres'),
  phoneNumber: z
    .string()
    .min(8, 'Numero de telefone precisa ter ao menos 8 caractéres'),
  description: z
    .string()
    .min(30, 'Descrição precisa ter ao menos 30 caractéres'),
  price: z.number().min(1, 'Seu preço precisa ser positivo'),
  age: z.number().min(18, 'Você precisa ter mais de 18 anos!').max(100),
  gender: z.string().min(1, 'Gênero é obrigatório'),
  gender_identity: z.string().optional(),
  languages: z.array(z.string()).min(1, 'Selecione ao menos uma Lingua'),
});

const pageTwoSchema = z.object({
  // Characteristics
  weight: z.number().min(30, 'Peso precisa ser ao menos 30kg'),
  height: z
    .number()
    .min(1.3, 'Altura precisa ser ao menos 1.40m')
    .max(3.0, 'Altura precisa ser menor que 2.5m'),
  ethnicity: z.string().min(1, 'Etnia é obrigatória'),
  eye_color: z.string().optional(),
  hair_color: z.string().min(1, 'Cor do seu cabelo é obrigatória'),
  hair_length: z.string().optional(),
  shoe_size: z.number().optional(),
  silicone: z.boolean().default(false),
  tattoos: z.boolean().default(false),
  piercings: z.boolean().default(false),
  smoker: z.boolean().optional(),
});

const pageThreeSchema = z.object({
  // Location
  neighborhood: z.string().optional(),
  city: z.number().min(1, 'Cidade é obrigatória'),
  state: z.string().length(2, 'Estado precisa conter ao menos 2 caractéres'),
  country: z.string().min(1, 'País é obrigatório'),
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
  'Suas Informações',
  'Características',
  'Localização',
] as const;

interface RegisterCompanionFormProps {
  cities: City[];
  companionData?: RegisterCompanionFormValues | null | undefined; // Optional companion data for editing
}

export function RegisterCompanionForm({
  cities,
  companionData,
}: RegisterCompanionFormProps) {
  const [currentPage, setCurrentPage] = React.useState(0);
  const linguasDisponiveis = [
    { value: 'Português', label: 'Português' },
    { value: 'Inglês', label: 'Inglês' },
    { value: 'Espanhol', label: 'Espanhol' },
    { value: 'Francês', label: 'Francês' },
    { value: 'Alemão', label: 'Alemão' },
    { value: 'Italiano', label: 'Italiano' },
  ];
  const [selectedLanguages, setLanguages] = React.useState<string[]>([
    'Português',
  ]);
  const { toast } = useToast();
  const router = useRouter();

  const validateCurrentPage = async () => {
    const values = form.getValues();
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
      setCurrentPage((prev) => prev + 1);
    } else {
      form.trigger();
    }
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => prev - 1);
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
        city: companionData.city, // City is an id
        phoneNumber: companionData.phoneNumber || '', // Provide default if null
        ethnicity: companionData.ethnicity || '', // Provide default if null
        hair_color: companionData.hair_color || '', // Provide default if null
        silicone: companionData.silicone || false, // Provide default if null
        tattoos: companionData.tattoos || false, // Provide default if null
        piercings: companionData.piercings || false, // Provide default if null
        smoker: companionData.smoker || false, // Provide default if null
        neighborhood: companionData.neighborhood || '', // Provide default if null
        state: companionData.state || '', // Provide default if null
        country: companionData.country || '', // Provide default if null
      };
    } else {
      return {
        name: '',
        shortDescription: '',
        phoneNumber: '',
        description: '',
        price: 0,
        age: 0,
        gender: '',
        gender_identity: '',
        languages: [],
        weight: 60,
        height: 1.6,
        ethnicity: '',
        eye_color: '',
        hair_color: '',
        hair_length: '',
        shoe_size: 36,
        silicone: false,
        tattoos: false,
        piercings: false,
        smoker: false,
        neighborhood: '',
        city: 1,
        state: '',
        country: '',
      };
    }
  };

  const form = useForm<RegisterCompanionFormValues>({
    resolver: zodResolver(RegisterCompanionFormSchema),
    defaultValues: getInitialValues(),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });
  const { user } = useUser();

  async function onSubmit(data: RegisterCompanionFormValues & { id?: number }) {
    try {
      if (companionData) {
        const clerkId = user?.id;

        if (!clerkId) {
          throw new Error('User ID not found');
        }

        await updateCompanionFromForm(clerkId, data);

        toast({
          title: 'Profile Updated',
          description: `Your profile has been successfully updated.`,
        });
      } else {
        // Registration: call registerCompanion
        await registerCompanion(data);
        toast({
          title: 'You have been registered',
          description: `Hey ${data.name}! You are now available in our platform.`,
        });
      }
      router.refresh();
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: companionData ? 'Update failed' : 'Registration failed',
        description:
          error instanceof globalThis.Error
            ? error.message
            : 'Something went wrong',
      });
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {companionData ? 'Edit Profile' : 'Registre-se'}
            </CardTitle>
            <CardDescription>
              {companionData
                ? 'Edite seu detalhes.'
                : 'Insira seus detalhes e apareça na melhor plataforma de acompanhantes de portugal.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Page One (Suas Informações) */}
            {currentPage === 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Suas Informações</h3>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
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
                    <FormItem>
                      <FormLabel>Numero de Telefone</FormLabel>
                      <FormControl>
                        <PhoneInput
                          defaultCountry={'PT'}
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
                <div className="grid grid-cols-2 md:flex md:flex-row gap-4 justify-between w-full">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem className="md:w-1/4">
                        <FormLabel>Preço (por hora)</FormLabel>
                        <FormControl>
                          <IMaskInput
                            mask="€ num"
                            blocks={{
                              num: {
                                mask: Number,
                                scale: 2,
                                min: 0,
                                max: 10000,
                                radix: ',',
                                thousandsSeparator: '.',
                              },
                            }}
                            placeholder="Insira seu preço cobrado"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={String(field.value)}
                            onAccept={(value: string) =>
                              field.onChange(
                                Number(value.replace(/[^0-9]/g, ''))
                              )
                            }
                          />
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
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="18"
                            max={100}
                            {...field}
                            value={field.value?.toString() || ''}
                            onChange={(e) =>
                              field.onChange(
                                Number.parseInt(e.target.value, 10)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Feminino">Feminino</SelectItem>
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
                            <SelectItem value="Cisgênero">Cisgênero</SelectItem>
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
                      <FormLabel>Linguas</FormLabel>
                      <MultiSelect
                        options={linguasDisponiveis}
                        onValueChange={field.onChange} // Direct form update
                        value={field.value} // Use form value
                        defaultValue={
                          companionData
                            ? companionData.languages
                            : ['Português']
                        } // Initial value
                        placeholder="Selecione suas Linguas"
                        variant="inverted"
                        animation={2}
                        maxCount={3}
                      />
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
                  Essa parte é muito importante para aparecer nos nossos filtros
                  e atrair novos clientes.
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
                            value={field.value?.toString() || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number.parseFloat(e.target.value)
                                  : 0
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
                              '0': /[1-2]/, // First digit: only 1-2
                              '9': /[0-9]/, // Other digits: 0-9
                            }}
                            placeholder="1,70"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={
                              field.value?.toString().replace('.', ',') || ''
                            }
                            onAccept={(value: string) => {
                              const numericValue = Number(
                                value.replace(',', '.')
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
                        <FormDescription className="text-xs text-muted-foreground">
                          Exemplo: 1,70
                        </FormDescription>
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
                            <SelectItem value="Marrom">Castanho</SelectItem>
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
                            value={field.value?.toString() || ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? Number.parseFloat(e.target.value)
                                  : 0
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
                            Tattoos{' '}
                          </FormLabel>
                          <FormDescription>Você tem tatuagens?</FormDescription>
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
                          <FormDescription>Você tem piercings?</FormDescription>
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
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <Select
                        onValueChange={(selected) => {
                          field.onChange(Number(selected));

                          const selectedCity = cities.find(
                            (c) => c.id === Number(selected)
                          );

                          if (selectedCity) {
                            form.setValue('state', selectedCity.state, {
                              shouldValidate: false,
                              shouldDirty: true,
                              shouldTouch: false,
                            });
                            form.setValue('country', selectedCity.country, {
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
                              placeholder="Selecione sua cidade"
                              defaultValue={
                                cities.find((c) => c.id === field.value)
                                  ?.city || ''
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
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentPage > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousPage}
              >
                Anterior
              </Button>
            )}
            {currentPage < formSections.length - 1 && (
              <Button type="button" onClick={handleNextPage}>
                Próximo
              </Button>
            )}
            {currentPage === formSections.length - 1 && (
              <Button type="submit">Cadastre-se</Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
