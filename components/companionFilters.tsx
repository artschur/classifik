"use client";

import { useState } from "react";
import type { CompanionFiltered } from "@/db/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanionsList, CompanionsListSkeleton } from "./companionsList";
import { Filter } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface FilterProps {
    companions: CompanionFiltered[];
}

export default function CompanionFilters({ companions }: FilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [filteredCompanions, setFilteredCompanions] = useState(companions);
    const [priceOrder, setPriceOrder] = useState(searchParams.get('price') || '');


    const createQueryString = (name: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set(name, value);
        return params.toString();
    };

    const handlePriceFilter = (value: string) => {
        setPriceOrder(value);
        if (priceOrder == 'asc') {
            setFilteredCompanions(companions.sort((a, b) => b.price - a.price));
        } else {
            setFilteredCompanions(companions.sort((a, b) => a.price - b.price));
        }
        createQueryString('price', value);

    };
    return (
        <div>
            <div className="flex w-full justify-between items-center h-32">
                <div className="flex flex-row justify-center items-center space-x-4">
                    <Select value={priceOrder || undefined} onValueChange={handlePriceFilter}>
                        <SelectTrigger className="w-[150px] rounded-full text-neutral-500">
                            <Filter size={18} />
                            <SelectValue placeholder="Preço" />
                        </SelectTrigger>
                        <SelectContent className="text-neutral-500 rounded-xl">
                            <SelectItem className="rounded-lg" value="asc">Menor preço</SelectItem>
                            <SelectItem className="rounded-lg" value="desc">Maior preço </SelectItem>
                        </SelectContent>
                    </Select>

                </div>
                <div>
                    <Select value={priceOrder || undefined} onValueChange={handlePriceFilter}>
                        <SelectTrigger className="w-[150px] rounded-full text-neutral-500">
                            <Filter size={18} />
                            <SelectValue placeholder="Idade" />
                        </SelectTrigger>
                        <SelectContent className="text-neutral-500 rounded-xl">
                            <SelectItem className="rounded-lg" value="asc">Menor preço</SelectItem>
                            <SelectItem className="rounded-lg" value="desc">Maior preço </SelectItem>
                            <SelectItem className="rounded-lg" value="desc">Maior preço </SelectItem>
                            <SelectItem className="rounded-lg" value="desc">Maior preço </SelectItem>
                            <SelectItem className="rounded-lg" value="desc">Maior preço </SelectItem>
                        </SelectContent>
                    </Select></div>
            </div>
            <CompanionsList companions={filteredCompanions} />
        </div>
    );
};