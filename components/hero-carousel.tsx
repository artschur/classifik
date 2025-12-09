"use client"

import { useRef } from "react"
import Image from "next/image"
import type { CompanionPreview, Media } from "@/types/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export function HeroCarousel({ companions }: { companions: CompanionPreview[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -400, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 400, behavior: "smooth" })
    }
  }

  const getImageUrl = (image: string | Media): string => {
    return typeof image === "string" ? image : image.publicUrl
  }

  return (
    <section className="w-full bg-background py-12 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center mb-2">Sugars Premium</h2>
          <p className="text-muted-foreground text-center">Descubra nossas sugars premium e verificadas</p>
        </div>

        <div className="relative">
          {/* Left Navigation Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 p-3 bg-background border rounded-full shadow-lg hover:bg-accent transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {companions.map((companion) => {
              const firstImage = companion.images[0]
              const imageUrl = firstImage ? getImageUrl(firstImage) : "/placeholder.svg?height=400&width=300"

              return (
                <Link href={`/companions/${companion.id}`} key={companion.id + companion.name} className="flex-none w-[280px] md:w-[320px] snap-start overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <Card
                    key={companion.id}
                    className="flex-none w-[280px] md:w-[320px] snap-start overflow-hidden hover:shadow-xl transition-shadow duration-300"

                  >
                    <div className="relative aspect-[3/4] w-full">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={companion.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 280px, 320px"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Card Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-xl font-bold mb-1">{companion.name}</h3>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/90">{companion.age} years</span>
                          <span className="text-white/90">{companion.city}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-lg font-bold">
                            {typeof companion.price === "number" ? `€${companion.price}` : companion.price}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              )
            })}
          </div>

          {/* Right Navigation Button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 p-3 bg-background border rounded-full shadow-lg hover:bg-accent transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
