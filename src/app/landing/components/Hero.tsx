"use client";

import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  return (
    <section id="home" className="relative flex items-center justify-center overflow-hidden bg-gradient-to-r from-sky-50 to-cyan-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          {/* Left content */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-sm text-sky-700 shadow-sm">
              <span>Trusted • Best Medical Service</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">We always provide best service</h1>
            <p className="text-sm text-gray-600 sm:text-base md:text-lg">
              Connect with top specialists, schedule appointments and manage your health records in a modern, secure platform.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/dashboard/appointments" className="rounded-full bg-sky-600 px-6 py-3 text-white text-sm font-semibold shadow hover:bg-sky-700">Make an appointment</Link>
              <Link href="#services" className="rounded-full border border-gray-200 bg-white px-5 py-3 text-sm hover:bg-sky-50 text-black">Learn more</Link>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link href="/dashboard/emergency" className="rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition">
                <p className="text-xs text-gray-700 font-semibold">Emergency</p>
                <p className="text-[12px] text-gray-400">Get emergency care fast</p>
              </Link>
              <Link href="/dashboard/appointments" className="rounded-xl bg-white p-3 shadow-lg ring-2 ring-sky-100 hover:shadow-2xl transition">
                <p className="text-xs text-gray-700 font-semibold">Appointment</p>
                <p className="text-[12px] text-gray-400">Book online instantly</p>
              </Link>
              <Link href="/dashboard/doctors" className="rounded-xl bg-white p-3 shadow-sm hover:shadow-md transition">
                <p className="text-xs text-gray-700 font-semibold">Find Doctor</p>
                <p className="text-[12px] text-gray-400">Search by specialty</p>
              </Link>
            </div>
          </div>

          {/* Right image */}
          <div className="relative flex items-center justify-center ml-0 lg:ml-60">
            <div className="relative h-[420px] w-[320px] sm:h-[480px] sm:w-[420px] md:h-[520px] md:w-[480px]">
              <Image src={'/assets/images/doctor1.png'} alt={'Doctor'} fill className={'object-cover'} sizes={'(max-width: 640px) 280px, 480px'} priority />
            </div>
            {/* Decorative shapes */}
            <div className="pointer-events-none absolute -top-14 -right-12 hidden h-44 w-44 rounded-full bg-cyan-100/70 blur-3xl lg:block" />
            <div className="pointer-events-none absolute -bottom-10 -right-20 hidden h-28 w-28 rounded-full bg-sky-200/60 blur-2xl lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
