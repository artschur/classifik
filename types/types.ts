import { Characteristic, City, Companion } from "../db/schema";

export interface Media {
  publicUrl: string;
  type?: "image" | "video";
  /**
   * Enquadramento não destrutivo, guardado por foto. O ponto focal é em
   * percentagem (50/50 é o centro, que era o comportamento fixo do
   * object-cover) e o zoom também (100 é sem ampliação). Ficam opcionais para
   * o código que ainda passa apenas o URL continuar a funcionar.
   */
  focalX?: number;
  focalY?: number;
  zoom?: number;
  /** Identifica a foto para quem pode alterá-la (a própria sugar ou o admin). */
  storagePath?: string;
  /**
   * Foto enviada numa edição e ainda por aprovar. Só é preenchido na fila de
   * verificação: nas leituras públicas estas fotos nem chegam a ser lidas.
   */
  pendingApproval?: boolean;
}

export type CompanionPreview = Pick<Companion, "id" | "name" | "age"> & {
  price: number | string;
  city: string;
  images: (string | Media)[];
  planType?: string | null;
};

export type CompanionFiltered = Pick<
  Companion,
  "id" | "name" | "shortDescription" | "price" | "age" | "verified"
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
  verificationVideoUrl?: string | null;
  phone?: string;
  /**
   * Distingue, na fila de verificação, uma edição de um perfil que já está no
   * ar de um registo novo que nunca foi aprovado. Recusar os dois tem
   * consequências opostas: a edição é descartada, o registo é apagado.
   */
  isPendingEdit?: boolean;
  /** O que ela mudou face ao que está publicado, para o admin comparar. */
  pendingChanges?: PendingChange[];
};

export type PendingChange = {
  label: string;
  before: string;
  after: string;
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
  gender?: "Masculino" | "Feminino" | "Trans";
};

export type CompanionById = Omit<
  Companion,
  | "id"
  | "created_at"
  | "updated_at"
  | "availability"
  | "reviews_summary"
  | "city_id"
  | "neighborhood_id"
  | "stripe_customer_id"
> & {
  // Add characteristics fields with exact names from select query
  weight: Characteristic["weight"];
  height: Characteristic["height"];
  ethnicity: Characteristic["ethnicity"];
  eyeColor: Characteristic["eye_color"];
  hairColor: Characteristic["hair_color"];
  hair_length: Characteristic["hair_length"];
  shoe_size: Characteristic["shoe_size"];
  silicone: Characteristic["silicone"];
  tattoos: Characteristic["tattoos"];
  piercings: Characteristic["piercings"];
  smoker: Characteristic["smoker"];
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

export type CitySummary = Pick<City, "slug" | "city">;

export type Region = {
  name: string;
  cities: CitySummary[];
};

export const regions: Region[] = [
  {
    name: "Lisboa",
    cities: [
      { slug: "lisboa", city: "Lisboa" },
      { slug: "oeiras", city: "Oeiras" },
      { slug: "cascais", city: "Cascais" },
      { slug: "estoril", city: "Estoril" },
      { slug: "sintra", city: "Sintra" },
      { slug: "amadora", city: "Amadora" },
      { slug: "odivelas", city: "Odivelas" },
      { slug: "almada", city: "Almada" },
      { slug: "montijo", city: "Montijo" },
      { slug: "mafra", city: "Mafra" },
    ],
  },
  {
    name: "Porto",
    cities: [
      { slug: "porto", city: "Porto" },
      { slug: "vila-de-gaia", city: "Vila de Gaia" },
      { slug: "matosinhos", city: "Matosinhos" },
      { slug: "maia", city: "Maia" },
      { slug: "povoa-de-varzim", city: "Póvoa de Varzim" },
      { slug: "vila-do-conde", city: "Vila do Conde" },
    ],
  },
  {
    name: "Algarve",
    cities: [
      { slug: "faro", city: "Faro" },
      { slug: "albufeira", city: "Albufeira" },
      { slug: "portimao", city: "Portimão" },
      { slug: "vilamoura", city: "Vilamoura" },
      { slug: "tavira", city: "Tavira" },
      { slug: "lagos", city: "Lagos" },
    ],
  },
  {
    name: "Madeira",
    cities: [{ slug: "madeira", city: "Madeira" }],
  },
];
