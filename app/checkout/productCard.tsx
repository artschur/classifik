'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Product } from './page';

const buttonClasses =
  'w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4';

export function ProductCard({
  product,
  hasProfile,
  adminTest = false,
}: {
  product: Product;
  hasProfile: boolean;
  /** Admin com perfil: mostra a compra de teste sem o mês grátis. */
  adminTest?: boolean;
}) {
  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/can-checkout');
      if (!res.ok) throw new Error(`can-checkout respondeu ${res.status}`);

      const data = await res.json();
      window.location.href = data.canCheckout
        ? `/api/checkout?priceId=${product.id}`
        : data.redirect;
    } catch (error) {
      // Sem isto, uma falha aqui deixava o botão sem reacção nenhuma e sem
      // rasto: o utilizador clicava e não acontecia nada.
      console.error('Falha ao iniciar o checkout:', error);
      alert('Não foi possível abrir o pagamento. Tenta novamente.');
    }
  };

  return (
    <Card key={product.id} className="flex flex-col h-full justify-between">
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
        <p className="text-3xl font-bold mt-auto">{product.price}</p>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        {/* Sem perfil o botão não finge que compra: leva ao registo, que é o
            passo que falta mesmo. */}
        {hasProfile ? (
          <button onClick={handleCheckout} className={buttonClasses}>
            Comprar
          </button>
        ) : (
          <Link href="/companions/register" className={buttonClasses}>
            Criar perfil primeiro
          </Link>
        )}
        {adminTest && (
          // Vai directo ao checkout: o servidor só tira o mês grátis a admins.
          <a
            href={`/api/checkout?priceId=${product.id}&semTrial=1`}
            className="w-full text-center text-xs text-amber-600 underline underline-offset-2"
          >
            Teste admin: comprar sem o mês grátis (cobra já)
          </a>
        )}
      </CardFooter>
    </Card>
  );
}
