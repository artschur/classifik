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
    <Card className="w-full max-w-5xl mx-auto overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8">
        <CardContent className="mt-24">
          x{/* Profile Header */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:-mt-20">
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center justify-center gap-2 sm:justify-start">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex items-center justify-center gap-2 mt-1 sm:justify-start">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-4 w-full mt-4 max-w-md" />
            </div>
          </div>
          {/* Stats Section */}
          <div className="grid grid-cols-3 gap-4 px-4 py-6 mt-6 border-t border-b sm:px-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-6 w-16 mx-auto mb-1" />
                <Skeleton className="h-4 w-12 mx-auto" />
              </div>
            ))}
          </div>
          {/* Action Buttons */}
          <div className="grid gap-4 mt-6 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-10 w-full mt-4" />
          {/* Image Grid Placeholder */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full" />
            ))}
          </div>
          {/* Characteristics */}
          <div className="mt-8">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 11 }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5" />
                  <div>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-24 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom Action Buttons */}
          <div className="grid grid-cols-1 gap-4 mt-8 sm:grid-cols-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </div>
    </Card>
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
