import { City } from "./schema";

export interface CompanionFiltered {
    id: number;
    name: string;
    description: string;
    price: number;
    age: number;
    city: string;
    weight: string;
    height: string;
    eyeColor?: string | null;
    hairColor: string;
    silicone: boolean | null;
    tattoos: boolean | null;
    piercings: boolean | null;
    smoker: boolean | null;
    verified: boolean | null;
}


export type FilterTypesCompanions = {
    hairColor?: string | null;
    price?: string;
    age?: string;
    sort?: string;
    silicone?: boolean;
    tattoos?: boolean;
    height?: string;
    weight?: string;
    smoker?: string;
    eyeColor?: string;
};

export interface CompanionById {
    id: number;
    name: string;
    price: number;
    verified: boolean | null;
    description: string;
    age: number;
    city: string;
    weight: number | string;
    height: number | string;
    ethnicity: string;
    eyeColor?: string;
    hairColor: string;
    silicone: boolean;
    tattoos: boolean;
    piercings: boolean;
    smoker?: boolean;
}

export interface Review {
    id: number;
    companion_id: number;
    user_id: string;
    comment: string;
    created_at: Date;
    updated_at: Date;
}

export type CitySummary = Pick<City, "slug" | "city">;
