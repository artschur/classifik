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
    // id: "price_1RAt1OCuEJW1dWBav2YzW54D",
    // id: "price_1RIsByEJQRIZgEwenkVNKNPt",
    // id: "price_1RQ8O9EJQRIZgEweScjlRZY1",
    id: 'price_1RQA2eEJQRIZgEwex35RbMMP',
    name: 'Plus',
    description: 'Seu perfil vai ser visivel no topo da sua cidade por 7 dias',
    price: '€30.00',
  },
  {
    // id: "price_1RAt2nCuEJW1dWBajoTLZQF1",
    // id: "price_1RIsBwEJQRIZgEwebyRvlBN8",
    // id: 'price_1RQ8P3EJQRIZgEweJhQTQK43',
    id: 'price_1RQA37EJQRIZgEwee89HkBet',
    name: 'Vip',
    description: 'Seu anúncio ficará visível por 14 dias',
    price: '€40.00',
  },
  {
    // id: "price_1RAt3DCuEJW1dWBajo4sXGXG",
    // id: "price_1RIsBuEJQRIZgEweQPe3PrRW",
    id: 'price_1RQA3iEJQRIZgEwe0vUw7ehc',
    name: 'Premium',
    description: 'Seu anúncio ficará visível por 30 dias',
    price: '€60.00',
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
