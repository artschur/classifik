"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MessageCircle, Phone, Check } from "lucide-react";
import type { CompanionById } from "@/db/types";

export default function SingleCompanionComponent({
    companion,
    countReviews,
}: { companion: CompanionById; countReviews: number; }) {
    return (
        <Card className="w-full max-w-5xl mx-auto overflow-hidden bg-white">
            {/* Banner Image */}
            <div className="relative h-48 bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-400">
                <Image
                    src="/placeholder.svg?height=192&width=768"
                    alt="Banner"
                    layout="fill"
                    objectFit="cover"
                    className="opacity-50"
                />
            </div>

            <CardContent className="relative p-4 sm:p-6">
                {/* Profile Header */}
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:-mt-16">
                    <div className="flex-shrink-0 w-32 h-32 overflow-hidden border-4 border-white rounded-full shadow-lg">
                        <Image
                            src={
                                "https://akns-images.eonline.com/eol_images/Entire_Site/20241112/819-sophie-rain-instagram-2-cjh-081124.jpg?fit=around%7C819:1024&output-quality=90&crop=819:1024;center,top"
                            }
                            alt={companion.name}
                            width={128}
                            height={128}
                            className="object-cover w-full h-full"
                        />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center gap-2 sm:justify-start">
                            <h1 className="text-2xl font-semibold sm:text-3xl">{companion.name}</h1>
                            {companion.verified && (
                                <Badge variant="secondary" className="text-green-800 bg-green-100">
                                    <Check className="w-3 h-3 mr-1" />
                                    Verificada
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center justify-center gap-2 mt-1 text-sm sm:justify-start text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>Online há 59 minutos</span>
                        </div>
                        <p className="mt-2 text-sm">{companion.description}</p>
                    </div>
                </div>

                {/* Stats Section */}
                <div className="flex items-center justify-between px-8 py-4 mt-6 border-t border-b">
                    <div className="text-center">
                        <p className="text-xl font-semibold">25</p>
                        <p className="text-xs text-muted-foreground">Mídias</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-semibold">R$ {companion.price}/h</p>
                        <p className="text-xs text-muted-foreground">Preço</p>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-semibold">{countReviews}</p>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-6">
                    <Button className="flex-1 text-white bg-red-500 hover:bg-red-600">Seguir</Button>
                    <Button variant="outline" className="flex-1">
                        Mais opções
                    </Button>
                </div>

                {/* Chat Section */}
                <div className="flex items-center gap-2 p-4 mt-6 text-lg bg-green-400 rounded-lg">
                    <Button variant="ghost" className="flex-1 text-white hover:bg-green-500">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Conversar online
                    </Button>
                </div>

                {/* Verification Notice */}
                <div className="flex items-center gap-2 p-4 mt-4 rounded-lg bg-green-50">
                    <Check className="w-5 h-5 text-green-500" />
                    <p className="text-sm text-green-700">Perfil verificado</p>
                </div>

                {/* Characteristics */}
                <div className="mt-6">
                    <h2 className="mb-3 text-lg font-semibold">Sobre mim</h2>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                        <CharacteristicItem label="Idade" emoji="🎂" value={`${companion.age} anos`} />
                        <CharacteristicItem label="Cidade" emoji="📍" value={companion.city} />
                        <CharacteristicItem label="Altura" emoji="📏" value={`${companion.height} cm`} />
                        <CharacteristicItem label="Peso" emoji="🏋️" value={`${companion.weight} kg`} />
                        <CharacteristicItem label="Etnia" emoji="🌍" value={companion.ethnicity} />
                        <CharacteristicItem emoji="👁️" label="Cor dos olhos" value={companion.eyeColor || "N/A"} />
                        <CharacteristicItem label="Cor do cabelo" emoji="💇" value={companion.hairColor} />
                        <CharacteristicItem label="Silicone" emoji="🍒" value={companion.silicone ? "Sim" : "Não"} />
                        <CharacteristicItem label="Tatuagens" emoji="💉" value={companion.tattoos ? "Sim" : "Não"} />
                        <CharacteristicItem label="Piercings" emoji="💎" value={companion.piercings ? "Sim" : "Não"} />
                        {companion.smoker !== undefined && (
                            <CharacteristicItem label="Fumante" emoji="🚬" value={companion.smoker ? "Sim" : "Não"} />
                        )}
                    </div>
                </div>

                {/* Contact Buttons */}
                <div className="grid grid-cols-1 gap-2 mt-6 sm:grid-cols-2">
                    <Button variant="outline" className="w-full" size="lg">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Conversar online
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                        <Phone className="w-4 h-4 mr-2" />
                        Ver telefone
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function CharacteristicItem({ emoji, label, value }: { emoji: string; label: string; value: string | number; }) {
    return (
        <div className="flex items-center gap-2">
            <span className="text-xl">{emoji}</span>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-medium">{value}</p>
            </div>
        </div>
    );
}

