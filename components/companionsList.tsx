import Link from "next/link";
import Image from "next/image";
import type { ISimpleCompanion } from "@/db/types";
import { getSimpleCompanions } from "@/db/queries";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Languages, DollarSign } from "lucide-react";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function CompanionsList({ city }: { city: string; }) {
  let companions: ISimpleCompanion[] = [];
  let error = null;

  try {
    companions = await getSimpleCompanions(city);
  } catch (e) {
    error = e instanceof Error ? e.message : "An error occurred while fetching companions";
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        <p>Error: {error}</p>
      </div>
    );
  }

  if (companions.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>No companions found.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {companions.map((companion: ISimpleCompanion) => (
        <Link
          key={companion.id}
          href={`/companions/${companion.id}`}
          className="transition-transform duration-200 ease-in-out transform hover:scale-105"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{companion.name}</span>
                <Badge variant="secondary">{companion.age} years</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-48 mb-4">
                <Image
                  src={`/placeholder.svg?text=${encodeURIComponent(companion.name)}`}
                  alt={companion.name}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-md"
                />
              </div>
              <p className="text-sm text-gray-600 line-clamp-3">{companion.description}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                <span>R$ {companion.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <User className="w-4 h-4 mr-1" />
                <span>View Profile</span>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function CompanionsListSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

