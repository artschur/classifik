"use client"

import { useRef } from "react"
import Image from "next/image"
import type { CompanionPreview, Media } from "@/types/types"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useLocale } from "@/components/locale-provider"
import { LocaleLink } from "@/components/locale-link"
import { nomeDistrito } from "@/lib/districts"
import { precoCartao } from "@/lib/preco"

const planRibbonStyles: Record<string, { bg: string; color: string; label: string; emoji: string }> = {
  vip:     { bg: 'linear-gradient(to right, #facc15, #f59e0b)', color: '#713f12', label: 'VIP',     emoji: '👑' },
  plus:    { bg: 'linear-gradient(to right, #fb923c, #fb7185)', color: '#ffffff',  label: 'Plus',    emoji: '⭐' },
  classic: { bg: 'linear-gradient(to right, #f9a8d4, #fb7185)', color: '#881337', label: 'Classic', emoji: '✨' },
}

function PlanBadge({ plan, locale }: { plan?: string | null; locale: string }) {
  if (!plan || plan === 'free') return null
  const style = planRibbonStyles[plan.toLowerCase()]
  if (!style) return null
  // Em português o plano chama-se Clássico, como na página de planos.
  const label = plan.toLowerCase() === 'classic' && locale !== 'en' ? 'Clássico' : style.label
  return (
    <div
      style={{
        position: 'absolute',
        top: '8px',
        left: '8px',
        background: style.bg,
        color: style.color,
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '4px 12px',
        borderRadius: '999px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        pointerEvents: 'none',
      }}
    >
      {style.emoji} {label}
    </div>
  )
}

export function HeroCarousel({ companions }: { companions: CompanionPreview[] }) {
  const carouselRef = useRef<HTMLDivElement>(null)
  const locale = useLocale()

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
    // Compacto: o bloco fica dentro da coluna da lista, logo acima dela. A
    // frase de apresentação que vinha por baixo do título saiu a pedido da
    // Katia: dava a entender que aqui estavam as verificadas, quando o bloco
    // é só de planos pagos.
    <section className="w-full mb-6">
      <div>
        <div className="mb-3">
          <h2 className="text-lg font-bold sm:text-xl">
            {locale === "en" ? "Featured profiles" : "Perfis em destaque"}
          </h2>
        </div>

        <div className="relative">
          {/* Left Navigation Button */}
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 hidden md:block p-2.5 bg-background border rounded-full shadow-lg hover:bg-accent transition-colors"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* Carousel Container */}
          <div
            ref={carouselRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {companions.map((companion, i) => {
              const firstImage = companion.images[0]
              const imageUrl = firstImage ? getImageUrl(firstImage) : "/placeholder.svg?height=400&width=300"

              return (
                <LocaleLink locale={locale} href={`/companions/${companion.id}`} key={companion.id + companion.name} className="flex-none w-[62%] sm:w-[240px] lg:w-[260px] snap-start overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <Card
                    key={companion.id}
                    className="w-full overflow-hidden rounded-xl border-rose-500/40 hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="relative aspect-[3/4] w-full">
                      <Image
                        src={imageUrl || "/placeholder.svg"}
                        alt={companion.name}
                        fill
                        // Primeiro cartão do carrossel: é a primeira foto que
                        // aparece no topo do distrito, carrega com prioridade.
                        priority={i === 0}
                        className="object-cover"
                        sizes="(max-width: 640px) 62vw, 260px"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <PlanBadge plan={companion.planType} locale={locale} />

                      {/* Card Info */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                        <h3 className="text-lg font-bold mb-1">{companion.name}</h3>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-white/90">{companion.age} {companion.age == 40 ? "+" : ""} {locale === "en" ? "years old" : "anos"}</span>
                          <span className="text-white/90">{nomeDistrito(companion.city, locale)}</span>
                        </div>
                        <div className="mt-2">
                          <span className="text-base font-bold">
                            {precoCartao(companion.price, locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </LocaleLink>
              )
            })}
          </div>

          {/* Right Navigation Button */}
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 hidden md:block p-2.5 bg-background border rounded-full shadow-lg hover:bg-accent transition-colors"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}
