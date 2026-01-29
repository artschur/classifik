import Image from "next/image"
import Link from "next/link"
import { SquarePlus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function Footer() {
  const navigationLinks = [
    { label: "Termos e Condições", href: "/termos-e-condicoes" },
    { label: "Política de Privacidade", href: "/politica-de-privacidade" },
    { label: "Política de Cookies", href: "/politica-de-cookies" },
    { label: "Sobre", href: "/sobre" },
  ]

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
                Sobre <span className="font-bold">onesugar</span>
              </h3>
            </div>
            <div className="text-neutral-400 text-sm leading-relaxed space-y-3">
              <p>a sweet hotter than usual</p>
              <p>
                <strong>Nome:</strong> Onesugar
              </p>
              <p>
                <strong>Endereço:</strong> Lisboa, Portugal
              </p>
              <p>
                <strong>Telefone:</strong> +351 934 600 827

              </p>
            </div>
          </div>

          {/* Center section - Navigation Links */}
          <div className="flex flex-col items-start md:items-center">
            <nav className="flex flex-col gap-3">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-neutral-100 hover:text-white font-medium transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Button
                variant="outline"
                className="mt-4 border-neutral-600 bg-transparent text-neutral-100 hover:bg-neutral-800 hover:text-white gap-2"
                asChild
              >
                <Link href="/checkout">
                  <SquarePlus className="h-4 w-4 text-violet-500" />
                  CRIAR ANÚNCIO
                </Link>
              </Button>
            </nav>
          </div>

          {/* Right section - Classifik Attribution */}
          <div className="flex flex-col items-start md:items-end">
            <div className="space-y-4">
              <p className="text-neutral-500 text-xs">
                &copy; {new Date().getFullYear()} Onesugar. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
