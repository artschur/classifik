"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Cigarette } from "lucide-react";
import { City } from "@/db/schema";
import { registerCompanion } from "@/db/queries/companions";



const pageOneSchema = z.object({
    // Companion Info
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    shortDescription: z.string().min(10, "Short description must be at least 10 characters"),
    phoneNumber: z.string().min(10, "Phone number must be at least 10 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().min(1, "Price must be positive"),
    age: z.number().min(18, "Must be at least 18 years old").max(100),
    gender: z.string().min(1, "Gender is required"),
    gender_identity: z.string().optional(),
    languages: z.array(z.string()).min(1, "At least one language is required"),
});

const pageTwoSchema = z.object({
    // Characteristics
    weight: z.number().min(30, "Weight must be at least 30kg"),
    height: z.number().min(1.4, "Height must be at least 1.40m"),
    ethnicity: z.string().min(1, "Ethnicity is required"),
    eye_color: z.string().optional(),
    hair_color: z.string().min(1, "Hair color is required"),
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
    city: z.number().min(1, "City is required"),
    state: z.string().length(2, "State must be 2 characters"),
    country: z.string().min(1, "Country is required"),
});

export type RegisterCompanionFormValues = z.infer<typeof RegisterCompanionFormSchema>;

const RegisterCompanionFormSchema = z.object({
    ...pageOneSchema.shape,
    ...pageTwoSchema.shape,
    ...pageThreeSchema.shape,
});

const formSections = ["Companion Info", "Characteristics", "Location"] as const;


export function RegisterCompanionForm({ cities }: { cities: City[]; }) {
    const [currentPage, setCurrentPage] = React.useState(0);

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
            }
            else if (currentPage === 2) {
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


    const form = useForm<RegisterCompanionFormValues>({
        resolver: zodResolver(RegisterCompanionFormSchema),
        defaultValues: {
            name: "",
            email: "",
            shortDescription: "",
            languages: ['portuguese'],
            phoneNumber: "",
            description: "",
            price: 0,
            age: 18,
            gender: "",
            gender_identity: "",
            weight: 30,
            height: 1.4,
            ethnicity: "",
            eye_color: "",
            hair_color: "",
            hair_length: "",
            shoe_size: 0,
            silicone: false,
            tattoos: false,
            piercings: false,
            smoker: false,
            neighborhood: "",
            city: 1,
            state: "",
            country: "",
        },
        mode: "onBlur",
        reValidateMode: "onChange",
    });

    const { toast } = useToast();

    function onSubmit(data: RegisterCompanionFormValues) {
        console.log(data);
        registerCompanion(data);

        toast({
            title: "You have been registered",
            description: `Hey ${data.name}! You are now available in our platform.`,
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Register yourself</CardTitle>
                        <CardDescription>Enter your details and start appearing in our platform today.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {currentPage === 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Companion Info</h3>
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter name" {...field} />
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
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter phone number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="Enter email" {...field} />
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
                                            <FormLabel>Short Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Enter short description" {...field} />
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
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Enter description" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price (per hour)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter price"
                                                    value={field.value?.toString() || ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number.parseFloat(e.target.value) : 0)}
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
                                            <FormLabel>Age</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter age"
                                                    max={100}
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number.parseInt(e.target.value, 10))}
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                            <FormControl>
                                                <Input placeholder="Enter gender identity" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="languages"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Linguas</FormLabel>
                                            <Select
                                                onValueChange={(selectedValue) => {
                                                    const newValues = field.value.includes(selectedValue)
                                                        ? field.value.filter((val: string) => val !== selectedValue)
                                                        : [...field.value, selectedValue];
                                                    field.onChange(newValues);
                                                }}
                                                value={field.value.toString()}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select languages" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Português">Portuguese</SelectItem>
                                                    <SelectItem value="Espanhol">Spanish</SelectItem>
                                                    <SelectItem value="Inglês">English</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {currentPage === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Características</h3>
                                <p className=" text-sm text-neutral-500 ">Essa parte é muito importante para aparecer nos nossos filtros e atrair novos clientes.</p>
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
                                                    onChange={(e) => field.onChange(e.target.value ? Number.parseFloat(e.target.value) : 0)}
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
                                                <Input
                                                    type="number"
                                                    placeholder="Insira sua Altura"
                                                    {...field}
                                                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
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
                                            <FormLabel>Ethnicity</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
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
                                            <FormLabel>Eye Color</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select your eye color" />
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
                                            <FormLabel>Hair Color</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select hair color" />
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
                                            <FormLabel>Hair Length</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select hair lenght" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">Short</SelectItem>
                                                    <SelectItem value="female">Middle</SelectItem>
                                                    <SelectItem value="long">Long</SelectItem>
                                                    <SelectItem value="other">Very Long</SelectItem>
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
                                            <FormLabel>Shoe Size (EU size)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter shoe size"
                                                    value={field.value?.toString() || ''}
                                                    onChange={(e) => field.onChange(e.target.value ? Number.parseFloat(e.target.value) : 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="silicone"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-base flex flex-row gap-2">Silicone</FormLabel>
                                                <FormDescription>Do you have silicone enhancements?</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                                                <FormLabel className="text-base flex flex-row gap-2">Tattoos </FormLabel>
                                                <FormDescription>Do you have tattoos?</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                                                <FormLabel className="text-base flex flex-row gap-2">Piercings</FormLabel>
                                                <FormDescription>Do you have piercings?</FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                                                <FormLabel className="text-base flex flex-row gap-2">Smoker <Cigarette /></FormLabel>
                                                <FormDescription>Are you a smoker?  </FormDescription>
                                            </div>
                                            <FormControl>
                                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}

                        {currentPage === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Location</h3>
                                <FormField
                                    control={form.control}
                                    name="neighborhood"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Neighborhood</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter neighborhood" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex flex-row justify-between">
                                    <FormField
                                        control={form.control}
                                        name="city"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Select City</FormLabel>
                                                <Select
                                                    onValueChange={(selected) => field.onChange(Number(selected))}
                                                    value={String(field.value)}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue
                                                                placeholder="Select a city"
                                                                // Show city name in selected state
                                                                // Find the current city object and display its name
                                                                defaultValue={
                                                                    cities.find((c) => c.id === field.value)?.city || ''
                                                                }
                                                            />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {cities.map((city) => (
                                                            <SelectItem
                                                                key={city.id}
                                                                value={String(city.id)}
                                                            >
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
                                        name="state"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>State</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter state (2 characters)" {...field} maxLength={2} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="country"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Country</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter country" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        {currentPage > 0 && (
                            <Button type="button" variant="outline" onClick={handlePreviousPage}>
                                Previous
                            </Button>
                        )}
                        {currentPage < formSections.length - 1 ? (
                            <Button type="button" onClick={handleNextPage}>
                                Next
                            </Button>
                        ) : (
                            <Button type="submit">Register yourself</Button>
                        )}
                    </CardFooter>
                </Card>
            </form>
        </Form>
    );
}

