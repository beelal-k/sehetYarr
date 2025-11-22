'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-sky-500" />
            <div>
              <p className="text-sm font-semibold text-gray-900">SehatYarr</p>
              <p className="text-xs text-gray-500">Modern Healthcare Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link className="text-xs text-gray-500 hover:text-sky-600" href="#">Terms</Link>
            <Link className="text-xs text-gray-500 hover:text-sky-600" href="#">Privacy</Link>
            <Link className="text-xs text-gray-500 hover:text-sky-600" href="#">Contact</Link>
          </div>
        </div>

        <p className="mt-6 text-xs text-gray-400">© {new Date().getFullYear()} SehatYarr. All rights reserved.</p>
      </div>
    </footer>
  );
}
