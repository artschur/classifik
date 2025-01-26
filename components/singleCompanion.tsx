
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCompanionById, getReviewsByCompanionId } from "@/db/queries";

export default async function SingleCompanionPage({ id }: { id: number; }) {

    const companions = await getCompanionById(id);
    const companion = companions[0];

    const detailRows = [
        [
            { label: "Age", value: companion.age },
            { label: "City", value: companion.city },
            { label: "Height", value: companion.height },
            { label: "Weight", value: companion.weight },
        ],
        [
            { label: "Ethnicity", value: companion.ethnicity },
            { label: "Eye Color", value: companion.eyeColor },
            { label: "Hair Color", value: companion.hairColor },
            { label: "Silicone", value: companion.silicone ? "Yes" : "No" },
        ],
        [
            { label: "Tattoos", value: companion.tattoos ? "Yes" : "No" },
            { label: "Piercings", value: companion.piercings ? "Yes" : "No" },
            { label: "Smoker", value: companion.smoker ? "Yes" : "No" },
        ],
    ];

    return (
        <div className="container mx-auto py-8 ">
            <Card className="overflow-hidden">
                <CardHeader className="pb-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="mb-4 md:mb-0">
                            <CardTitle className="text-2xl font-bold">{companion.name}</CardTitle>
                            <p className="text-muted-foreground">{companion.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Badge variant={companion.verified ? "default" : "secondary"}>
                                {companion.verified ? "Verified" : "Unverified"}
                            </Badge>
                            <span className="text-xl font-bold">${companion.price}</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {detailRows.flat().map((detail, index) => (
                                <div key={index} className="flex flex-col">
                                    <span className="text-sm font-medium text-muted-foreground">{detail.label}</span>
                                    <span className="text-sm">{detail.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
