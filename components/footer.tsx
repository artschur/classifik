import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-grid border-t py-6 md:py-4 bg-neutral-900 text-white px-4 sm:px-6 lg:px-8">
      <div className="w-full text-sm flex flex-col items-center justify-center">
        <div className="flex-row flex gap-2 pb-2">
          <Image
            src="/sugar-logo.svg"
            width={30}
            height={30}
            alt="onesugar"
            className="invert"
          />
          <h4 className="text-lg">onesugar</h4>
        </div>
        <p>a sweet hotter than usual 🌶️</p>
        <p className="text-neutral-400">
          &copy; {new Date().getFullYear()} Onesugar. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
