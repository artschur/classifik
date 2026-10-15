/**
 * Formato do conteúdo de cada distrito, partilhado pela versão portuguesa
 * (page.tsx) e pela inglesa (en/).
 */
export interface EditorialSection {
  heading?: string;
  paragraphs: string[];
}

export interface NearbyLink {
  city: string;
  slug: string;
}

export interface CityFAQItem {
  q: string;
  a: string;
}

export interface CityData {
  title: string;
  description: string;
  h1: string;
  intro?: string;
  editorial?: {
    mainHeading: string;
    sections: EditorialSection[];
    nearbyLinks: NearbyLink[];
  };
  faq?: CityFAQItem[];
}
