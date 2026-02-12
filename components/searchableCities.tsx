'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

interface City {
  slug: string;
  city: string;

}
interface SearchableCitiesProps {
  cities: City[];
}

export function SearchableCities({ cities }: SearchableCitiesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: CMD+K or CTRL+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // ESC to clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const handleClear = () => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  // Filter cities based on search query
  const filteredCities = useMemo(() => {
    if (!searchQuery.trim()) {

      return cities.toSorted((c1: City, c2: City) => c1.city.localeCompare(c2.city))
    }

    const query = searchQuery.toLowerCase();

    return cities.filter((city) =>
      city.city.toLowerCase().includes(query)
    );
  }, [cities, searchQuery]);

  const totalCities = cities.length;
  const filteredCitiesCount = filteredCities.length;

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-6 w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Procure cidades... (⌘K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 text-lg rounded-full border-2 border-primary bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-muted-foreground px-4">
            {filteredCitiesCount === 0 ? (
              <>Nenhum distrito encontrada para &quot;{searchQuery}&quot;</>
            ) : (
              <>
                {filteredCitiesCount} de {totalCities} distrito encontrados
              </>
            )}
          </p>
        )}
      </div>

      {/* Cities List */}
      {filteredCitiesCount === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl font-semibold text-muted-foreground">
            Nenhuma distrito encontrado
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Tente procurar por outro distrito
          </p>
        </div>
      ) : (
        <div className="w-full">
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredCities.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/location/${city.slug}`}
                  className="block text-2xl border border-neutral-800 text-neutral-400 hover:text-white hover:bg-primary transition-colors duration-400 cursor-pointer px-4 py-2 rounded-lg"
                >
                  Distrito de {city.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
