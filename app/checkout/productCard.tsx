'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { OpcaoProduto, Product } from './page';
import { useLocale } from '@/components/locale-provider';
import { LocaleLink } from '@/components/locale-link';
import { localizeHref } from '@/lib/i18n';

const TEXT = {
  pt: {
    erro: 'Não foi possível abrir o pagamento. Tenta novamente.',
    comprar: 'Escolher',
    criarPerfil: 'Criar perfil primeiro',
    dias: (n: number) => `${n} dias`,
  },
  en: {
    erro: 'We could not open the payment page. Please try again.',
    comprar: 'Choose',
    criarPerfil: 'Create your profile first',
    dias: (n: number) => `${n} days`,
  },
} as const;

const buttonClasses =
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-9 py-2 px-4';

export function ProductCard({
  product,
  hasProfile,
}: {
  product: Product;
  hasProfile: boolean;
}) {
  const locale = useLocale();
  const t = TEXT[locale];
  // O /api/checkout não passa pelo /en, por isso o idioma vai na query.
  const langParam = locale === 'en' ? '&lang=en' : '';

  const handleCheckout = async (opcao: OpcaoProduto) => {
    try {
      const res = await fetch('/api/can-checkout');
      if (!res.ok) throw new Error(`can-checkout respondeu ${res.status}`);

      const data = await res.json();
      window.location.href = data.canCheckout
        ? `/api/checkout?priceId=${encodeURIComponent(opcao.precoId)}${langParam}`
        : localizeHref(data.redirect, locale);
    } catch (error) {
      // Sem isto, uma falha aqui deixava o botão sem reacção nenhuma e sem
      // rasto: o utilizador clicava e não acontecia nada.
      console.error('Falha ao iniciar o checkout:', error);
      alert(t.erro);
    }
  };

  return (
    <Card className="flex flex-col h-full justify-between">
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
        {product.benefits && product.benefits.length > 0 && (
          <ul className="mt-2 mb-2 list-disc list-inside text-sm text-neutral-300">
            {product.benefits.map((benefit, idx) => (
              <li key={idx}>{benefit}</li>
            ))}
          </ul>
        )}
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-end">
        {/* Uma linha por duração: 7, 15 e 30 dias, cada uma com o seu preço. */}
        <ul className="mt-auto divide-y divide-border rounded-lg border">
          {product.opcoes.map((opcao) => (
            <li key={opcao.dias} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{t.dias(opcao.dias)}</p>
                <p className="text-xl font-bold leading-tight">{opcao.preco}</p>
              </div>
              {hasProfile ? (
                <button onClick={() => handleCheckout(opcao)} className={buttonClasses}>
                  {t.comprar}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {/* Sem perfil o botão não finge que compra: leva ao registo, que é o
            passo que falta mesmo. */}
        {!hasProfile && (
          <LocaleLink locale={locale} href="/companions/register" className={`${buttonClasses} w-full`}>
            {t.criarPerfil}
          </LocaleLink>
        )}
      </CardFooter>
    </Card>
  );
}
