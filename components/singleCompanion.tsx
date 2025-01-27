
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCompanionById, getReviewsByCompanionId } from "@/db/queries";

export default async function SingleCompanionComponent({ id }: { id: number; }) {

    const companions = await getCompanionById(id);
    const companion = companions[0];

    const detailGroups = [
        {
            title: "About me",
            details: [
                { label: "Age", value: companion.age },
                { label: "Height", value: companion.height },
                { label: "Weight", value: companion.weight },
                { label: "Ethnicity", value: companion.ethnicity },
                { label: "Eye Color", value: companion.eyeColor },
                { label: "Hair Color", value: companion.hairColor },
            ],
        },
        {
            title: "Location",
            details: [{ label: "City", value: companion.city }],
        },
        {
            title: "Characteristics",
            details: [
                { label: "Silicone", value: companion.silicone ? "Yes" : "No" },
                { label: "Tattoos", value: companion.tattoos ? "Yes" : "No" },
                { label: "Piercings", value: companion.piercings ? "Yes" : "No" },
                { label: "Smoker", value: companion.smoker ? "Yes" : "No" },
            ],
        },
    ];
    return (
        <Card className="overflow-hidden">
            <div className="relative h-64 md:h-96">
                <Image
                    src={"https://akns-images.eonline.com/eol_images/Entire_Site/20241112/819-sophie-rain-instagram-2-cjh-081124.jpg?fit=around%7C819:1024&output-quality=90&crop=819:1024;center,top"}
                    alt={companion.name}
                    fill
                    className="object-cover"
                />
            </div>
            <CardHeader className="pb-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle className="text-3xl font-bold">{companion.name}</CardTitle>
                        <p className="text-muted-foreground mt-1">{companion.description}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-4 md:mt-0">
                        <Badge variant={companion.verified ? "default" : "secondary"} className="text-sm">
                            {companion.verified ? "Verified" : "Unverified"}
                        </Badge>
                        <span className="text-3xl font-bold text-primary">${companion.price}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="mt-6">
                <Button className="w-full mb-6">Book Now</Button>
                <Separator className="my-6" />
                {detailGroups.map((group, groupIndex) => (
                    <div key={groupIndex} className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">{group.title}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {group.details.map((detail, detailIndex) => (
                                <div key={detailIndex} className="flex flex-col">
                                    <span className="text-sm font-medium text-muted-foreground">{detail.label}</span>
                                    <span className="text-sm">{detail.value}</span>
                                </div>
                            ))}
                        </div>
                        {groupIndex < detailGroups.length - 1 && <Separator className="my-6" />}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
