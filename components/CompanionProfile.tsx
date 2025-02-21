import { getCompanionById } from '@/db/queries';
import type React from 'react';
import { Suspense } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  MessageCircle,
  Phone,
  Check,
  Cake,
  MapPin,
  Ruler,
  Weight,
  Globe,
  Eye,
  User,
  Droplet,
  PenTool,
  Gem,
  Cigarette,
  Share2,
  Heart,
  Star,
} from 'lucide-react';
import { ImageGrid } from '@/components/imageGrid';
import { getLastSignInByClerkId } from '@/db/queries/userActions';

async function LastSignIn({ clerkId }: { clerkId: string }) {
  const lastSignIn = await getLastSignInByClerkId(clerkId);
  return <span>{lastSignIn}</span>;
}

export async function CompanionProfile({ id }: { id: number }) {
  const companion = await getCompanionById(id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{companion.name}</h1>
        <div className="flex items-center mt-2 space-x-4">
          {companion.verified && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Check className="w-3 h-3 mr-1" /> Verificada
            </Badge>
          )}
          <div className="flex items-center text-yellow-400">
            <Star className="w-5 h-5 mr-1" />
            <span className="font-semibold">4.9</span>
          </div>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            <Suspense fallback={<Skeleton className="h-4 w-24" />}>
              <LastSignIn clerkId={companion.auth_id} />
            </Suspense>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <ImageGrid images={companion.images} />

          <Card className="mt-8">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold mb-4">
                Sobre {companion.name}
              </h2>
              <p className="text-muted-foreground mb-6">
                {companion.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6">
                <CharacteristicItem
                  label="Idade"
                  value={`${companion.age} anos`}
                />
                <CharacteristicItem
                  label="Altura"
                  value={`${companion.height} cm`}
                />
                <CharacteristicItem
                  label="Peso"
                  value={`${companion.weight} kg`}
                />
                <CharacteristicItem label="Etnia" value={companion.ethnicity} />
                <CharacteristicItem
                  label="Cor dos olhos"
                  value={companion.eyeColor || 'N/A'}
                />
                <CharacteristicItem
                  label="Cor do cabelo"
                  value={companion.hairColor}
                />
                <CharacteristicItem
                  label="Silicone"
                  value={companion.silicone ? 'Sim' : 'Não'}
                />
                <CharacteristicItem
                  label="Tatuagens"
                  value={companion.tattoos ? 'Sim' : 'Não'}
                />
                <CharacteristicItem
                  label="Piercings"
                  value={companion.piercings ? 'Sim' : 'Não'}
                />
                {companion.smoker !== undefined && (
                  <CharacteristicItem
                    label="Fumante"
                    value={companion.smoker ? 'Sim' : 'Não'}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <span className="text-2xl font-bold">
                    € {companion.price}
                  </span>
                  <span className="text-muted-foreground">/hora</span>
                </div>
                <div className="flex space-x-2">
                  <Button size="icon" variant="outline">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button className="w-full mb-3 bg-green-600 hover:bg-green-700 text-white">
                <MessageCircle className="w-4 h-4 mr-2" />
                Conversar no Whatsapp
              </Button>

              <Button variant="outline" className="w-full">
                <Phone className="w-4 h-4 mr-2" />
                Ver telefone
              </Button>

              <div className="mt-6 text-sm text-muted-foreground">
                <p>Idiomas: {companion.languages.join(', ')}</p>
                <p className="mt-2">Mídias: {companion.images.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function CompanionSkeleton() {
  return (
    <div className="max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex items-center mt-2 space-x-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <span className="text-muted-foreground">·</span>
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="col-span-3 h-full row-span-2">
              <Skeleton className="aspect-[4/3 h-full w-full rounded-xl" />
            </div>
            <div className="col-span-1">
              <Skeleton className="aspect-[3/4] w-full rounded-xl" />
            </div>
            <div className="col-span-1">
              <Skeleton className="aspect-[4/4] w-full rounded-xl" />
            </div>
          </div>
        </div>

        <div>
          <Card className="sticky top-12">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Skeleton className="h-9 w-32" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-9" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </div>

              <Skeleton className="h-10 w-full mb-3" />
              <Skeleton className="h-10 w-full" />

              <div className="mt-6">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 col-span-2">
          <CardContent className="p-6 ">
            <h2 className="text-2xl font-semibold mb-4">
              <Skeleton className="h-8 w-44" />
            </h2>
            <Skeleton className="h-20 w-full mb-6" />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-6">
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
              <Skeleton className="h-14 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CharacteristicItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
