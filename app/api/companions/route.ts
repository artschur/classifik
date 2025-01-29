import { getCompanionsToFilter } from "@/db/queries/companions";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    
    // Get all filter parameters
    const city = searchParams.get('city');
    const price = searchParams.get('price');
    const age = searchParams.get('age');
    const sort = searchParams.get('sort');
    const silicone = searchParams.get('silicone');
    const tattoos = searchParams.get('tattoos');
    const hairColor = searchParams.get('hairColor');
    const height = searchParams.get('height');
    const weight = searchParams.get('weight');
    const smoker = searchParams.get('smoker');

    // Validate city parameter
    if (!city) {
        return Response.json({ error: 'City parameter is required' }, { status: 400 });
    }

    try {
        const companions = await getCompanionsToFilter(city, {
            price: price ?? '',
            age: age ?? '',
            sort: sort ?? '',
            silicone: silicone ?? '',
            tattoos: tattoos ?? '',
            hairColor: hairColor ?? '',
            height: height ?? '',
            weight: weight ?? '',
            smoker: smoker ?? ''
        });

        return Response.json(companions);
    } catch (error) {
        console.error('Error fetching companions:', error);
        return Response.json(
            { error: 'Failed to fetch companions' },
            { status: 500 }
        );
    }
}