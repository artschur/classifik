import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ReviewsSkeleton() {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <Skeleton className="h-8 w-[250px] mb-2" />
                    <Skeleton className="h-4 w-[180px]" />
                </div>
                <Skeleton className="h-6 w-20" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-12 w-16" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <Skeleton className="h-4 w-24 mb-4" />
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-4 w-8" />
                            <Skeleton className="h-2 flex-1" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            </div>

            <Skeleton className="w-full h-10 mb-8" />

            {/* Review Cards */}
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="mb-4">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div className="flex gap-4">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div>
                                <Skeleton className="h-4 w-32 mb-2" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </div>
                        <Skeleton className="h-8 w-8" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4 mt-2" />
                            </div>

                            <div className="space-y-3">
                                <Skeleton className="h-4 w-40" />
                                <div className="grid grid-cols-2 gap-4">
                                    {Array.from({ length: 4 }).map((_, j) => (
                                        <div key={j}>
                                            <Skeleton className="h-4 w-24 mb-1" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>

                            <div className="space-y-2">
                                <Skeleton className="h-4 w-40" />
                                <Skeleton className="h-4 w-32" />
                            </div>

                            {/* Response Card */}
                            <Card className="bg-rose-50 border-rose-100">
                                <CardContent className="pt-4">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="w-8 h-8 rounded-full" />
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <Skeleton className="h-4 w-24" />
                                                <Skeleton className="h-4 w-20" />
                                            </div>
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

