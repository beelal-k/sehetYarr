'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const sample = [
  { id: 1, text: 'Great experience — friendly staff and quick service.', name: 'Amina', role: 'Patient', image: '/assets/testimonials/Ahmad.webp' },
  { id: 2, text: 'Platform helps me manage appointments smoothly and reliably.', name: 'Dr. Ahmed', role: 'Cardiologist', image: '/assets/testimonials/umair.webp' },
  { id: 3, text: 'Fast and professional — highly recommended for telemedicine.', name: 'Bilal', role: 'Patient', image: '/assets/testimonials/bilal.webp' },
];

export default function Testimonials() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % sample.length), 4000);
    return () => clearInterval(t);
  }, []);

  const current = sample[index];

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">What our community says</h2>
          <p className="text-xs text-gray-500">Patient and doctor testimonials</p>
        </div>

        <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-2">
          <div>
            <p className="min-h-[90px] text-sm text-gray-600">“{current.text}”</p>
            <p className="mt-3 text-sm font-semibold text-gray-900">— {current.name}</p>
            <p className="text-xs text-gray-500">{current.role}</p>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="relative h-64 w-56 overflow-hidden rounded-xl bg-gray-200 shadow-lg">
              <Image src={current.image} alt={current.name} fill className="object-cover" sizes="(max-width: 640px) 224px, 256px" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
