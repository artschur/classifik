'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { City } from '@/db/schema';
import { MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAvailableCities } from '@/db/queries';

interface CitySelectionModalProps {
  triggerButton?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CitySelectionModal({ triggerButton, open: controlledOpen, onOpenChange }: CitySelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [internalOpen, setInternalOpen] = useState(false);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Determine if modal should be open
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    async function fetchCities() {
      try {
        setLoading(true);
        const citiesData = await getAvailableCities();
        setCities(citiesData);
      } catch (error) {
        console.error('Error fetching cities:', error);
      } finally {
        setLoading(false);
      }
    }

    if (open) {
      fetchCities();
    }
  }, [open]);

  const filteredCities = cities.filter(
    (city) =>
      city.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCitySelect = (slug: string) => {
    router.push(`/location/${slug}`);
    setOpen(false);
  };

  // If controlled (used in two-step modal), don't render trigger button
  if (controlledOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Escolha seu distrito</DialogTitle>
            <DialogDescription>
              Descubra sugars premium na sua região e viva experiências
              únicas com total discrição.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 py-2">
            <Input
              placeholder="Pesquisar distrito..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
          </div>
          <ScrollArea className="h-[300px] pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="space-y-2 w-full">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="flex flex-row items-center justify-between w-full border rounded-md p-3 animate-pulse"
                      >
                        <div className="h-4 bg-muted w-1/2 rounded"></div>
                        <div className="h-3 bg-muted w-1/4 rounded"></div>
                      </div>
                    ))}
                </div>
              </div>
            ) : filteredCities.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {filteredCities.map((city) => (
                  <Button
                    key={city.id}
                    variant="outline"
                    className="justify-start h-auto py-3 px-4"
                    onClick={() => handleCitySelect(city.slug)}
                  >
                    <div className="flex flex-row items-center justify-between w-full">
                      <span className="font-medium">{city.city}</span>
                      <span className="text-xs text-muted-foreground capitalize">
                        {city.country}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum distrito encontrada para "{searchQuery}"
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    );
  }

  // If not controlled (standalone usage), render with trigger button
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="default" className="gap-2 w-48">
            <MapPin className="h-4 w-4" />
            Encontrar por distrito
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Escolha seu distrito</DialogTitle>
          <DialogDescription>
            Descubra sugars premium na sua região e viva experiências
            únicas com total discrição.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 py-2">
          <Input
            placeholder="Pesquisar distrito..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>
        <ScrollArea className="h-[300px] pr-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="space-y-2 w-full">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-row items-center justify-between w-full border rounded-md p-3 animate-pulse"
                    >
                      <div className="h-4 bg-muted w-1/2 rounded"></div>
                      <div className="h-3 bg-muted w-1/4 rounded"></div>
                    </div>
                  ))}
              </div>
            </div>
          ) : filteredCities.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredCities.map((city) => (
                <Button
                  key={city.id}
                  variant="outline"
                  className="justify-start h-auto py-3 px-4"
                  onClick={() => handleCitySelect(city.slug)}
                >
                  <div className="flex flex-row items-center justify-between w-full">
                    <span className="font-medium">{city.city}</span>
                    <span className="text-xs text-muted-foreground capitalize">
                      {city.country}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum distrito encontrada para "{searchQuery}"
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
