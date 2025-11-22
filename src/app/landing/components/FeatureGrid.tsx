'use client';
import { Heart, Stethoscope, Activity, Bone } from 'lucide-react';

const features = [
  { title: 'Primary Care', desc: 'Routine and preventive care', icon: Stethoscope },
  { title: 'Pediatrics', desc: 'Children & infants care', icon: Heart },
  { title: 'Cardiology', desc: 'Heart specialists & care', icon: Activity },
  { title: 'Orthopedics', desc: 'Bone & joint treatment', icon: Bone },
];

export default function FeatureGrid() {
  return (
    <section id="services" className="bg-gray-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">What medical services we provide</h2>
          <p className="text-xs text-gray-500">Comprehensive healthcare for every need</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl bg-white p-6 text-center shadow-sm hover:shadow-md">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-sky-50">
                <f.icon className="h-5 w-5 text-sky-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-1 text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
