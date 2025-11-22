'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 shadow" />
            <span className="text-base font-bold text-gray-900">SehatYarr</span>
          </div>

          <nav className="hidden gap-8 md:flex">
            <Link href="#home" className="text-sm text-gray-700 hover:text-sky-600">Home</Link>
            <Link href="#services" className="text-sm text-gray-700 hover:text-sky-600">Services</Link>
            <Link href="#doctors" className="text-sm text-gray-700 hover:text-sky-600">Doctors</Link>
            <Link href="#contact" className="text-sm text-gray-700 hover:text-sky-600">Contact</Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link href="/auth/sign-in" className="px-3 py-1 text-sm text-gray-700 hover:text-sky-600">Sign in</Link>
            <Link href="/auth/sign-up" className="rounded-full bg-sky-600 px-4 py-2 text-white text-sm font-semibold shadow-sm hover:bg-sky-700">Get Started</Link>
          </div>

          {/* Mobile: simple button */}
          <button className="md:hidden p-2 text-gray-800">Menu</button>
        </div>
      </div>
    </header>
  );
}
