/**
 * Identidade da marca para os dados estruturados (Organization e WebSite).
 *
 * "OneSugar" confunde-se nas pesquisas com outros produtos de nome parecido,
 * e há sites a copiar os títulos da marca. Declarar os nomes alternativos e
 * os perfis oficiais (sameAs) ajuda o buscador a ligar tudo à mesma entidade
 * e a reconhecer o onesugar.pt como o site oficial.
 */
export const BRAND_NAME = 'OneSugar';

export const BRAND_ALTERNATE_NAMES = ['OneSugar Portugal', 'onesugar.pt'];

/**
 * Perfis oficiais da marca noutras plataformas (YouTube, Instagram, etc.),
 * com o URL completo. Só entram perfis geridos pela própria OneSugar.
 * Com a lista vazia, o sameAs simplesmente não é emitido.
 */
export const BRAND_OFFICIAL_PROFILES: string[] = [];

export const ORGANIZATION_ID = 'https://www.onesugar.pt/#organization';
export const WEBSITE_ID = 'https://www.onesugar.pt/#website';
