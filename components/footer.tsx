import Image from "next/image"
import { SquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LocaleLink } from "@/components/locale-link"
import { getLocale } from "@/lib/locale.server"

// Termos, Privacidade e Cookies ainda só existem em português: no rodapé
// inglês o nome vem em inglês, com a indicação do idioma da página.
const FOOTER_TEXT = {
  pt: {
    links: [
      { label: "Ajuda para Anunciantes", href: "/ajuda-anunciantes" },
      { label: "Termos e Condições", href: "/termos-e-condicoes" },
      { label: "Política de Privacidade", href: "/politica-de-privacidade" },
      { label: "Política de Cookies", href: "/politica-de-cookies" },
      { label: "Sobre", href: "/sobre" },
    ],
    about: "Sobre",
    name: "Nome",
    address: "Endereço",
    phone: "Telefone",
    city: "Lisboa, Portugal",
    createAd: "CRIAR ANÚNCIO",
    rights: "Todos os direitos reservados.",
  },
  en: {
    links: [
      { label: "Help for advertisers", href: "/ajuda-anunciantes" },
      { label: "Terms and Conditions (in Portuguese)", href: "/termos-e-condicoes" },
      { label: "Privacy Policy (in Portuguese)", href: "/politica-de-privacidade" },
      { label: "Cookie Policy (in Portuguese)", href: "/politica-de-cookies" },
      { label: "About", href: "/sobre" },
    ],
    about: "About",
    name: "Name",
    address: "Address",
    phone: "Phone",
    city: "Lisbon, Portugal",
    createAd: "CREATE A LISTING",
    rights: "All rights reserved.",
  },
} as const

export default async function Footer() {
  const locale = await getLocale()
  const t = FOOTER_TEXT[locale]
  const navigationLinks = t.links

  return (
    <footer className="bg-neutral-900 text-neutral-100 py-10 px-6 md:px-12 lg:px-20">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left section - About onesugar */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/sugar-logo.svg"
                width={32}
                height={32}
                alt="onesugar logo"
                className="invert"
              />
              <h3 className="text-lg font-normal">
                {t.about} <span className="font-bold">onesugar</span>
              </h3>
            </div>
            <div className="text-neutral-400 text-sm leading-relaxed space-y-3">
              <p>a sweet hotter than usual</p>
              <p>
                <strong>{t.name}:</strong> OneSugar
              </p>
              <p>
                <strong>{t.address}:</strong> {t.city}
              </p>
              <p>
                <strong>{t.phone}:</strong> +351 913 895 353

              </p>
            </div>
          </div>

          {/* Center section - Navigation Links */}
          <div className="flex flex-col items-start md:items-center">
            <nav className="flex flex-col gap-3">
              {navigationLinks.map((link) => (
                <LocaleLink
                  locale={locale}
                  key={link.href}
                  href={link.href}
                  className="text-neutral-100 hover:text-white font-medium transition-colors"
                >
                  {link.label}
                </LocaleLink>
              ))}
              <Button
                variant="outline"
                className="mt-4 border-neutral-600 bg-transparent text-neutral-100 hover:bg-neutral-800 hover:text-white gap-2"
                asChild
              >
                <LocaleLink locale={locale} href="/checkout">
                  <SquarePlus className="h-4 w-4 text-violet-500" />
                  {t.createAd}
                </LocaleLink>
              </Button>
            </nav>
          </div>

          {/* Right section - Classifik Attribution */}
          <div className="flex flex-col items-start md:items-end">
            <div className="space-y-4">
              <p className="text-neutral-500 text-xs">
                &copy; {new Date().getFullYear()} OneSugar. {t.rights}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
