import { CitySummary } from '@/types/types';
import Link from 'next/link';

export function SelectCidadesCadastradas({ cities }: { cities: CitySummary[]; }) {

    return (
        <div className=" flex flex-col items-left justify-start gap-2">
            {cities.map((city) => (
                <Link
                    key={city.slug}
                    href={`/location/${city.slug}`}
                    className='text-3xl text-neutral-600 hover:text-white hover:bg-primary transition-colors duration-400 cursor-pointer px-2 rounded-md'
                >
                    {city.city}
                </Link>
            ))}
        </div>
    );
};;