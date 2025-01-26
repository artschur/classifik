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



const pageOneSchema = z.object({
    // Companion Info
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    price: z.number().min(0, "Price must be positive"),
    age: z.number().min(18, "Must be at least 18 years old").max(100),
    gender: z.string().min(1, "Gender is required"),
    gender_identity: z.string().optional(),
    languages: z.string().optional(),
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
    city: z.string().min(1, "City is required"),
    state: z.string().length(2, "State must be 2 characters"),
    country: z.string().min(1, "Country is required"),
});

type RegisterCompanionFormValues = z.infer<typeof RegisterCompanionFormSchema>;

const RegisterCompanionFormSchema = z.object({
    ...pageOneSchema.shape,
    ...pageTwoSchema.shape,
    ...pageThreeSchema.shape,
});

const formSections = ["Companion Info", "Characteristics", "Location"] as const;


export function RegisterCompanionForm({ cities }: { cities: { name: string; slug: string; state: string; country: string; }[]; }) {
    const [currentPage, setCurrentPage] = React.useState(0);

    const handleCityChange = (citySlug: string) => {
        const selectedCity = cities.find(city => city.slug === citySlug);
        if (selectedCity) {
            form.setValue('city', selectedCity.slug);
            form.setValue('state', selectedCity.state);
            form.setValue('country', selectedCity.country);
        }
    };

    const validateCurrentPage = async () => {
        const values = form.getValues();
        console.log(currentPage);
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
        console.log(isValid);
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
            description: "",
            price: 0,
            age: 18,
            gender: "",
            gender_identity: "",
            languages: "",
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
            city: "",
            state: "",
            country: "",
        },
        mode: "onBlur",
        reValidateMode: "onChange",
    });

    const { toast } = useToast();

    function onSubmit(data: RegisterCompanionFormValues) {
        console.log(data);
        // Handle form submission here

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
                        <CardTitle>Register Companion</CardTitle>
                        <CardDescription>Enter the details of the new companion.</CardDescription>
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
                                            <FormLabel>Price</FormLabel>
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
                                            <FormLabel>Gender</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select gender" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
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
                                            <FormLabel>Gender Identity</FormLabel>
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
                                            <FormLabel>Languages</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter languages" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                        {currentPage === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Characteristics</h3>
                                <p className=" text-secondary">Insert more details about yourself. This is very important to attracting more clients and appearing more.</p>
                                <FormField
                                    control={form.control}
                                    name="weight"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Weight (kg)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter weight"
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
                                            <FormLabel>Height (m)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter height"
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
                                            <FormControl>
                                                <Input placeholder="Enter ethnicity" {...field} />
                                            </FormControl>
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
                                            <FormControl>
                                                <Input placeholder="Enter eye color" {...field} />
                                            </FormControl>
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
                                            <FormControl>
                                                <Input placeholder="Enter hair color" {...field} />
                                            </FormControl>
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
                                            <FormControl>
                                                <Input placeholder="Enter hair length" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="shoe_size"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Shoe Size</FormLabel>
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
                                                <FormLabel className="text-base">Silicone</FormLabel>
                                                <FormDescription>Does this companion have silicone enhancements?</FormDescription>
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
                                                <FormLabel className="text-base">Tattoos</FormLabel>
                                                <FormDescription>Does this companion have tattoos?</FormDescription>
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
                                                <FormLabel className="text-base">Piercings</FormLabel>
                                                <FormDescription>Does this companion have piercings?</FormDescription>
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
                                                <FormLabel className="text-base">Smoker</FormLabel>
                                                <FormDescription>Is this companion a smoker?</FormDescription>
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
                                                <FormLabel>City</FormLabel>
                                                <FormControl>
                                                    <Select onValueChange={(value) => { field.onChange(value); handleCityChange(value); }}>
                                                        <SelectTrigger className="w-[180px]">
                                                            <SelectValue placeholder="Select a city" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {cities.map((city) => (
                                                                <SelectItem key={city.slug} value={city.slug}>
                                                                    {city.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </FormControl>
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

