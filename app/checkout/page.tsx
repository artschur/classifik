import { hasCompanionPaid } from '@/db/queries/companions';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ProductCard } from './productCard';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
}
const products = [
  {
    id: 'price_1RbnIFCZhSZjuUHNWbRH1gx9',
    name: 'Basico',
    description: 'Seu perfil vai ser visivel no topo da sua cidade por 7 dias',
    price: '€40.00',
  },
  {
    id: 'price_1RbnIqCZhSZjuUHNMppbWPE3',
    name: 'Plus',
    description: 'Seu anúncio ficará visível por 14 dias',
    price: '€45.00',
  },
  {
    id: 'price_1RbnJcCZhSZjuUHNg5ae8KRf',
    name: 'VIP',
    description: 'Seu anúncio ficará visível por 30 dias',
    price: '€50.00',
  },
];

export default async function CheckoutPage() {
  const { userId } = await auth();
  const hasPaid = await hasCompanionPaid(userId as string);
  if (hasPaid) {
    redirect('/profile');
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Selecione duração do Anúncio</h1>
      <p className="mb-4">
        Escolha a duração do seu anúncio. Após o pagamento, seu perfil será visível no topo da sua
        cidade, atraindo mais clientes.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
