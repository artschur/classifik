import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CompanionSkeleton() {
    return (
        <div className="container mx-auto py-8">
            <Card className="overflow-hidden">
                <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-4 md:mb-0">
                            <Skeleton className="h-8 w-[200px] mb-2" />
                            <Skeleton className="h-4 w-[300px]" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mt-6">
                        <Skeleton className="h-6 w-24 mb-4" />
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {Array.from({ length: 11 }).map((_, index) => (
                                <div key={index} className="flex flex-col gap-2">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-4 w-24" />
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

