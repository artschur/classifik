import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ThumbsUp } from "lucide-react";
import { Review } from "@/db/schema";


export default function CompanionReviews({ reviews, companionName }: { reviews: Review[]; companionName: string; }) {
    return (
        <Card className="w-full max-w-5xl mx-auto mt-8">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-semibold">Reviews sobre {companionName}</CardTitle>
                <Badge variant="secondary">{reviews.length} reviews</Badge>
            </CardHeader>
            <CardContent>
                {reviews.length > 0 ? (
                    reviews.map((review) => (
                        <div key={review.id} className="mb-6 last:mb-0">
                            <div className="flex items-start gap-4">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${review.user_id}`} />
                                    <AvatarFallback>{review.user_id.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold">{review.user_id}</h3>
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${1 == 1 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">{review.created_at?.toLocaleDateString().toString() ?? ''}</p>
                                    <p className="mt-2 text-sm">{review.comment}</p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                                            <ThumbsUp className="w-4 h-4 mr-1" />
                                            Útil
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-8 text-center">
                        <p className="text-muted-foreground">Nenhum review ainda</p>
                        <Button variant="outline" className="mt-4">
                            Faça seu review grátis
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

