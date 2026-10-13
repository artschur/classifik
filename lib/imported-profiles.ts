/**
 * Perfis criados a partir de candidatas importadas (staging.candidatos) antes
 * de a própria pessoa ter conta. auth_id e email são obrigatórios e únicos na
 * tabela companions, por isso ficam com valores provisórios, trocados pelos
 * dela quando reclamar o perfil com o convite.
 */
export const IMPORTED_AUTH_PREFIX = 'import_';

export const importedAuthId = (candidateId: string) => `${IMPORTED_AUTH_PREFIX}${candidateId}`;

/** Domínio .invalid: reservado, nunca entrega correio, por isso nada sai para lá. */
export const importedEmail = (candidateId: string) => `import+${candidateId}@onesugar.invalid`;

/** Ainda sem conta Clerk: o perfil é gerido pelo admin. */
export const isImportedAuthId = (authId: string | null | undefined) =>
  Boolean(authId?.startsWith(IMPORTED_AUTH_PREFIX));
