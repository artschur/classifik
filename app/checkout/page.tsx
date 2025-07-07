import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ProductCard } from './productCard';
import { hasActiveAd } from '@/db/queries/kv';
import { isVerificationPending } from '../actions/document-verification';
export interface Product {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  price: string;
}

const products: Product[] = [
  {
    id: 'price_1RbnIFCZhSZjuUHNWbRH1gx9',
    name: 'Básico',
    description: 'Presença estratégica com recursos essenciais para se destacar. 30 dias',
    benefits: [
      'Destaque na listagem da cidade escolhida',
      'Exibição antes dos anúncios gratuitos',
      'Selo “BÁSICO” no perfil',
      'Suporte via sistema de atendimento prioritário',
    ],
    price: '€40.00',
  },
  {
    id: 'price_1RbnIqCZhSZjuUHNMppbWPE3',
    name: 'Plus',
    description: 'Mais visibilidade e prioridade para o seu perfil. 30 dias.',
    benefits: [
      'Posição de maior destaque na cidade escolhida',
      'Prioridade nas buscas (acima de anúncios Básico e Gratuito)',
      'Listagem acima dos perfis do plano Básico',
      'Selo “PLUS” visível no seu perfil',
      'Suporte com atendimento prioritário',
      'Acesso à lista de bloqueios/clientes indesejados',
      'Anúncio principal com mais chances de visualização',
    ],
    price: '€45.00',
  },
  {
    id: 'price_1RbnJcCZhSZjuUHNg5ae8KRf',
    name: 'VIP',
    description: 'Máximo destaque e prioridade total para o seu perfil. 30 dias.',
    benefits: [
      'Destaque absoluto na sua cidade',
      'Prioridade máxima nos resultados de busca',
      'Posição preferencial na seção de visitas por cidade',
      'Listado antes de todos os perfis do site',
      'Visibilidade superior aos planos Básico e Plus',
      'Selo “VIP” exclusivo no seu perfil',
      'Possibilidade de gravar um áudio de apresentação',
      'Suporte premium com atendimento dedicado',
      'Acesso completo à lista de bloqueios/clientes indesejados',
      'Máxima exposição na plataforma',
    ],
    price: '€50.00',
  },
];

export default async function CheckoutPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const [isUserVerified, hasPaid] = await Promise.all([
    isVerificationPending(userId),
    hasActiveAd(userId as string),
  ]);

  if (isUserVerified) {
    redirect('/verification/pending');
  }

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
