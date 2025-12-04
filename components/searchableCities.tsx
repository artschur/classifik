'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import type { Region } from '@/types/types';

interface SearchableCitiesProps {
  regions: Region[];
}

export function SearchableCities({ regions }: SearchableCitiesProps) {
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

  // Filter regions and cities based on search query
  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) {
      return regions;
    }

    const query = searchQuery.toLowerCase();

    return regions
      .map((region) => {
        const matchesRegion = region.name.toLowerCase().includes(query);

        // If region name matches, show all cities in that region
        if (matchesRegion) {
          return region;
        }

        // Otherwise, filter cities by name
        const filteredCities = region.cities.filter((city) =>
          city.city.toLowerCase().includes(query)
        );

        if (filteredCities.length === 0) {
          return null;
        }

        return {
          ...region,
          cities: filteredCities,
        };
      })
      .filter((region): region is Region => region !== null);
  }, [regions, searchQuery]);

  // Calculate total cities count
  const totalCities = regions.reduce(
    (acc, region) => acc + region.cities.length,
    0
  );

  const filteredCitiesCount = filteredRegions.reduce(
    (acc, region) => acc + region.cities.length,
    0
  );

  return (
    <div className="w-full">
      {/* Search Bar */}
      <div className="mb-6 w-full">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Procure cidades ou regiões... (⌘K)"
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
              <>Nenhuma cidade encontrada para &quot;{searchQuery}&quot;</>
            ) : (
              <>
                {filteredCitiesCount} de {totalCities} cidades encontradas
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
            Nenhuma cidade encontrada
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Tente procurar por outra cidade ou região
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-6">
          {filteredRegions.map((region) => (
            <div key={region.name} className="w-full">
              <h2 className="text-4xl font-bold text-primary mb-2">
                {region.name}
              </h2>
              <ul className="flex flex-col gap-2 pl-4">
                {region.cities.map((city) => (
                  <li key={city.slug}>
                    <Link
                      href={`/location/${city.slug}`}
                      className="text-2xl text-neutral-600 hover:text-white hover:bg-primary transition-colors duration-400 cursor-pointer px-2 rounded-md inline-block"
                    >
                      {city.city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
