import { db, kv } from '@/db';
import { auth } from '@clerk/nextjs/server';
import { LocaleLink } from '@/components/locale-link';
import { getLocale } from '@/lib/locale.server';

const TEXT = {
  pt: {
    semSessao: 'Usuário não autenticado.',
    negado: 'Acesso negado. Assinatura pagamento necessario.',
    titulo: 'Pagamento realizado com sucesso.',
    obrigado: 'Obrigado por sua compra.',
    beneficios:
      'Você já tem acesso imediato de seus benefícios. Contate nosso suporte caso precise de ajuda!',
    audio: 'Registre seu Audio aqui',
  },
  en: {
    semSessao: 'You are not signed in.',
    negado: 'Access denied. A paid subscription is required.',
    titulo: 'Payment successful.',
    obrigado: 'Thank you for your purchase.',
    beneficios:
      'Your benefits are available right away. Contact our support team if you need any help!',
    audio: 'Record your audio here',
  },
} as const;

export default async function Success() {
  const locale = await getLocale();
  const t = TEXT[locale];
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    return <div className="text-red-500">{t.semSessao}</div>;
  }

  if (sessionClaims.plan === 'free') {
    return <div className="text-red-500">{t.negado}</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">{t.titulo}</h1>
        <p className="text-lg">{t.obrigado}</p>
        <p className="text-gray-600">{t.beneficios}</p>

        <div className="mt-8">
          {sessionClaims.metadata.plan === 'vip' && (
            <div className="w-full min-h-full">
              <LocaleLink
                locale={locale}
                className="p-2 bg-neutral-800 rounded-lg"
                href="/companions/register/audio"
              >
                {t.audio}
              </LocaleLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
