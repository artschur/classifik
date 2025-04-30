'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Product } from "./page";

export function ProductCard({ product }: { product: Product; }) {

    const handleCheckout = async () => {
        window.location.href = `/api/checkout?priceId=${product.id}`;
    };

    return (
        <Card key={product.id} className="flex flex-col">
            <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>{product.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <p className="text-3xl font-bold">{product.price}</p>
            </CardContent>
            <CardFooter>
                <button
                    onClick={handleCheckout}
                    className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
                >
                    Select
                </button>
            </CardFooter>
        </Card>
    );
}