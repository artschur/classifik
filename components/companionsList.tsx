import Link from "next/link";
import Image from "next/image";
import type { CompanionFiltered } from "@/types/types";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";


export function CompanionsList({ companions }: { companions: CompanionFiltered[]; }) {
  if (!companions || companions.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p>No companions found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                <p className="text-sm text-gray-600 line-clamp-3">{companion.shortDescription}</p>
              </CardContent>
              <CardFooter className="flex items-center justify-between">
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
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, index) => (
        <Card key={index} className="h-full">
          <CardHeader>
            <Skeleton className="w-3/4 h-6" />
          </CardHeader>
          <CardContent>
            <Skeleton className="w-full h-48 mb-4" />
            <Skeleton className="w-full h-4 mb-2" />
            <Skeleton className="w-3/4 h-4" />
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Skeleton className="w-1/4 h-4" />
            <Skeleton className="w-1/4 h-4" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

