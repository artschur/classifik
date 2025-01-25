'use client';

import { useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import Button from './ui/button';

export function SelectCidadesCadastradas({ cities }: { cities: { name: string; slug: string; }[]; }) {
    const router = useRouter();
    const [selectedCity, setSelectedCity] = useState('');

    const handleSelect = () => {
        if (selectedCity) {
            router.push(`/location/${selectedCity}`);
        }
    };

    return (
        <div className=" flex items-center justify-center gap-x-4">
            <Select onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Cities" />
                </SelectTrigger>
                <SelectContent>
                    {cities.map((city) =>
                        <SelectItem key={city.slug} value={city.slug}>{city.name}</SelectItem>
                    )}
                </SelectContent>
            </Select>

            <Button onClick={handleSelect}>Confirm</Button>
        </div>
    );
};