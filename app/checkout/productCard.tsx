'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Product } from './page';
import {
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  SignInButton,
} from '@clerk/nextjs';

const buttonClasses =
  'w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4';

export function ProductCard({ product }: { product: Product }) {
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
      <CardFooter className="flex-col items-stretch gap-2">
        {/* Enquanto a sessão não é conhecida, o botão existe na mesma, apenas
            desactivado: sem isto o cartão ficava sem botão nenhum e parecia
            avariado. */}
        <ClerkLoading>
          <button className={buttonClasses} disabled>
            Comprar
          </button>
        </ClerkLoading>
        <ClerkLoaded>
          <SignedIn>
            <button onClick={handleCheckout} className={buttonClasses}>
              Comprar
            </button>
          </SignedIn>
          <SignedOut>
            {/* Quem ainda não tem conta vê os planos à mesma; o login entra só
                aqui, e o forceRedirectUrl trá-la de volta aos planos depois. */}
            <SignInButton
              forceRedirectUrl="/checkout"
              signUpForceRedirectUrl="/checkout"
            >
              <button className={buttonClasses}>Comprar</button>
            </SignInButton>
            <p className="text-xs text-center text-muted-foreground">
              É preciso ter conta para subscrever.
            </p>
          </SignedOut>
        </ClerkLoaded>
      </CardFooter>
    </Card>
  );
}
