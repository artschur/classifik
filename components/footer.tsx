import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-neutral-800 bg-neutral-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-8 lg:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Left section - Onesugar Brand */}
            <div className="flex flex-col items-center md:items-start space-y-3">
              <div className="flex items-center gap-3">
                <Image
                  src="/sugar-logo.svg"
                  width={32}
                  height={32}
                  alt="onesugar logo"
                  className="invert"
                />
                <h3 className="text-xl font-semibold tracking-tight">onesugar</h3>
              </div>
              <p className="text-neutral-400 text-sm font-medium">a sweet hotter than usual 🌶️</p>
            </div>

            {/* Center section - Copyright */}
            <div className="flex flex-col items-center space-y-2">
              <p className="text-neutral-500 text-xs text-center">
                &copy; {new Date().getFullYear()} Onesugar.
              </p>
              <p className="text-neutral-500 text-xs text-center">Todos os direitos reservados.</p>
            </div>

            {/* Right section - Classifik Attribution */}
            <div className="flex flex-col pr-12 items-center md:items-end space-y-3">
              <Link href={"https://agenciaclassifik.com.br/"}>
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo_classifik.png"
                    width={40}
                    height={40}
                    alt="Classifik Agency"
                    className="rounded-md"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-neutral-400 uppercase tracking-wide font-medium">
                      Desenvolvido por
                    </span>
                    <span className="text-sm text-neutral-200 font-semibold">Agência Classifik</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
