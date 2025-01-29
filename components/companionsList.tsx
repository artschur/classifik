import Link from "next/link";
import Image from "next/image";
import type { CompanionFiltered, ISimpleCompanion } from "@/db/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


export function CompanionsList({ companions }: { companions: CompanionFiltered[]; }) {
  if (!companions || companions.length === 0) {
    return (
      <div className="text-center text-gray-500 p-4">
        <p>No companions found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {companions.map((companion: CompanionFiltered) => (
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
                    src={`/image.png`}
                    alt={companion.name}
                    fill={true}
                    style={{ objectFit: "contain" }}
                  />
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">{companion.description}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center">
                  <span>€ {companion.price.toFixed(2)}</span>
                </div>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
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

