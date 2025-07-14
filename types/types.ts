import { Characteristic, City, Companion } from '../db/schema';

export interface Media {
  publicUrl: string;
  type?: 'image' | 'video';
}

export type CompanionFiltered = Pick<
  Companion,
  'id' | 'name' | 'shortDescription' | 'price' | 'age' | 'verified'
> & {
  weight: string;
  height: string;
  eyeColor?: string | null;
  hairColor: string;
  silicone: boolean | null;
  tattoos: boolean | null;
  ethinicity: string;
  piercings: boolean | null;
  smoker: boolean | null;
  images: (string | Media)[];
  planType?: string | null;
};

export type FilterTypesCompanions = {
  hairColor?: string | null;
  search?: string;
  page?: string;
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

export type CompanionById = Omit<
  Companion,
  | 'id'
  | 'created_at'
  | 'updated_at'
  | 'availability'
  | 'reviews_summary'
  | 'city_id'
  | 'neighborhood_id'
  | 'stripe_customer_id'
> & {
  // Add characteristics fields with exact names from select query
  weight: Characteristic['weight'];
  height: Characteristic['height'];
  ethnicity: Characteristic['ethnicity'];
  eyeColor: Characteristic['eye_color'];
  hairColor: Characteristic['hair_color'];
  hair_length: Characteristic['hair_length'];
  shoe_size: Characteristic['shoe_size'];
  silicone: Characteristic['silicone'];
  tattoos: Characteristic['tattoos'];
  piercings: Characteristic['piercings'];
  smoker: Characteristic['smoker'];
  images: string[];
};

export interface Review {
  id: number;
  companion_id: number;
  user_id: string;
  comment: string;
  created_at: Date;
  updated_at: Date;
}

export type CitySummary = Pick<City, 'slug' | 'city'>;

export type Region = {
  name: string;
  cities: CitySummary[];
};

export const regions: Region[] = [
  {
    name: 'Lisboa',
    cities: [
      { slug: 'lisboa', city: 'Lisboa' },
      { slug: 'oeiras', city: 'Oeiras' },
      { slug: 'cascais', city: 'Cascais' },
      { slug: 'estoril', city: 'Estoril' },
      { slug: 'sintra', city: 'Sintra' },
      { slug: 'amadora', city: 'Amadora' },
      { slug: 'odivelas', city: 'Odivelas' },
      { slug: 'almada', city: 'Almada' },
      { slug: 'montijo', city: 'Montijo' },
      { slug: 'mafra', city: 'Mafra' },
    ],
  },
  {
    name: 'Porto',
    cities: [
      { slug: 'porto', city: 'Porto' },
      { slug: 'vila-de-gaia', city: 'Vila de Gaia' },
      { slug: 'matosinhos', city: 'Matosinhos' },
      { slug: 'maia', city: 'Maia' },
      { slug: 'povoa-de-varzim', city: 'Póvoa de Varzim' },
      { slug: 'vila-do-conde', city: 'Vila do Conde' },
    ],
  },
  {
    name: 'Algarve',
    cities: [
      { slug: 'faro', city: 'Faro' },
      { slug: 'albufeira', city: 'Albufeira' },
      { slug: 'portimao', city: 'Portimão' },
      { slug: 'vilamoura', city: 'Vilamoura' },
      { slug: 'tavira', city: 'Tavira' },
      { slug: 'lagos', city: 'Lagos' },
    ],
  },
];
