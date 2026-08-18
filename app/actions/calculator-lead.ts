'use server';

import {
  sendConversionEventToRD,
  RD_CONVERSION_CALCULADORA,
} from '@/lib/rd-station';

/**
 * Capta um lead a partir da calculadora pública, antes de existir conta.
 *
 * Só é chamado depois de consentimento explícito no formulário (RGPD): sem
 * as duas caixas marcadas o botão nem submete. O telefone é o único dado
 * pessoal recolhido nesta fase.
 *
 * O evento de conversão cria o contacto no RD Station e serve de gatilho
 * para os fluxos de automação — o mesmo mecanismo usado na aprovação e
 * rejeição de perfis.
 */
export async function captureCalculatorLead(input: {
  phone: string;
  simulatedMonthly?: number;
}): Promise<{ success: boolean }> {
  const phone = input.phone.trim();

  // Validação mínima: o RD Station exige email OU telefone válido.
  if (phone.replace(/\D/g, '').length < 9) {
    return { success: false };
  }

  try {
    await sendConversionEventToRD(
      { phone },
      RD_CONVERSION_CALCULADORA,
      undefined,
      input.simulatedMonthly
        ? { cf_ganho_simulado: String(input.simulatedMonthly) }
        : undefined,
    );
    return { success: true };
  } catch (error) {
    console.error('Falha ao captar lead da calculadora', error);
    // Nunca bloqueia o utilizador: ele segue para o registo de qualquer forma.
    return { success: false };
  }
}
