/**
 * Quantos perfis cada leva da listagem traz (páginas de distrito e
 * /companions). Fica aqui, e não em db/queries/companions.ts, porque aquele
 * ficheiro é 'use server' e só pode exportar funções.
 *
 * 12 enche linhas certas na grelha de 2 colunas (telemóvel), 3 e 4 (ecrãs
 * largos). Com 9 a última linha ficava a meio.
 */
export const TAMANHO_LISTA = 12;
