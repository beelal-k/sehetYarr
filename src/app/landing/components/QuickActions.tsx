"use client";

import Link from 'next/link';

export default function QuickActions() {
  return (
    <section className="bg-white py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/dashboard/doctors" className="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition hover:translate-y-[-2px]">
            <h3 className="text-sm font-semibold text-gray-900">Check doctor's profile</h3>
            <p className="text-xs text-gray-500">Search for doctors and view profiles</p>
          </Link>
          <Link href="/dashboard/appointments" className="rounded-lg bg-white p-4 shadow-md ring-2 ring-sky-100">
            <h3 className="text-sm font-semibold text-gray-900">Request consultation</h3>
            <p className="text-xs text-gray-500">Start a consultation and get detailed reports</p>
          </Link>
          <Link href="/dashboard/overview" className="rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition hover:translate-y-[-2px]">
            <h3 className="text-sm font-semibold text-gray-900">Easy steps and get your solution</h3>
            <p className="text-xs text-gray-500">Appointments, records and follow-ups in one place</p>
          </Link>
        </div>
      </div>
    </section>
  );
}
