import { Region } from '@/types/types';
import Link from 'next/link';

export function SelectCidadesCadastradas({ regions }: { regions: Region[] }) {
  return (
    <div className="flex flex-col items-start gap-6">
      {regions.map((region) => (
        <div key={region.name} className="w-full">
          <h2 className="text-4xl font-bold text-primary mb-2">
            {region.name}
          </h2>
          <ul className="flex flex-col gap-2 pl-4">
            {region.cities.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/location/${city.slug}`}
                  className="text-2xl text-neutral-600 hover:text-white hover:bg-primary transition-colors duration-400 cursor-pointer px-2 rounded-md"
                >
                  {city.city}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
