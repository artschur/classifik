'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define your product options
const products = [
    {
        id: "price_1RAt1OCuEJW1dWBav2YzW54D",
        name: "7 Dias De Anúncio",
        description: "Seu perfil vai ser visivel no topo da sua cidade por 7 dias",
        price: "€15.00"
    },
    {
        id: "price_1RAt2nCuEJW1dWBajoTLZQF1",
        name: "14 Dias De Anúncio",
        description: "Seu anúncio ficará visível por 14 dias",
        price: "€25.00"
    },
    {
        id: "price_1RAt3DCuEJW1dWBajo4sXGXG",
        name: "30 Dias De Anúncio",
        description: "Seu anúncio ficará visível por 30 dias",
        price: "€40.00"
    }
];

export default function CheckoutPage() {
    const router = useRouter();

    const handleCheckout = (priceId: string) => {
        router.push(`/api/checkout?priceId=${priceId}`);
    };

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Select Ad Duration</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((product) => (
                    <Card key={product.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle>{product.name}</CardTitle>
                            <CardDescription>{product.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <p className="text-3xl font-bold">{product.price}</p>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className="w-full"
                                onClick={() => handleCheckout(product.id)}
                            >
                                Select
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}