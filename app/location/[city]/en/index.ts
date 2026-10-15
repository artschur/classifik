import type { CityData } from '../types';
import { districtsEnA } from './group-a';
import { districtsEnB } from './group-b';
import { districtsEnC } from './group-c';
import { districtsEnD } from './group-d';

/**
 * Texto em inglês das páginas de distrito (/en/location/<distrito>).
 *
 * Não é tradução literal da versão portuguesa: está escrito para quem visita
 * Portugal (turistas, expatriados, viagens de negócios). As chaves são os
 * mesmos slugs de cityMetadata e de EN_DISTRICTS em lib/i18n.ts.
 */
export const cityMetadataEn: Record<string, CityData> = {
  ...districtsEnA,
  ...districtsEnB,
  ...districtsEnC,
  ...districtsEnD,
};
