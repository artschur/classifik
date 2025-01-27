import Link from 'next/link';

export function SelectCidadesCadastradas({ cities }: { cities: { name: string; slug: string; }[]; }) {

    return (
        <div className=" flex flex-col items-left justify-start gap-2">
            {cities.map((city) => (
                <Link
                    key={city.slug}
                    href={`/location/${city.slug}`}
                    className='text-3xl text-neutral-600 hover:text-white hover:bg-neutral-600 transition-colors duration-400 cursor-pointer px-2 rounded-md'
                >
                    {city.name}
                </Link>
            ))}
        </div>
    );
};;