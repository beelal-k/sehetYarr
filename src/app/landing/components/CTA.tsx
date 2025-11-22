"use client";

import Link from 'next/link';

export default function CTA() {
  return (
    <section className="bg-sky-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow-md text-center">
          <h2 className="text-2xl font-bold text-gray-900">It’s time to change your life today</h2>
          <p className="mt-2 text-xs text-gray-500">Start with an appointment and manage your health easily in one place</p>
            <div className="mt-6">
              <Link href="/auth/sign-up" className="rounded-full bg-sky-600 px-6 py-3 text-white font-semibold hover:bg-sky-700 shadow">Get Started</Link>
            </div>
        </div>
      </div>
    </section>
  );
}
