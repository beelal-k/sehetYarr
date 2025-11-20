import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SehetYar - Healthcare Management System',
    short_name: 'SehetYar',
    description: 'Offline-capable healthcare management system for hospitals, doctors, and patients',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#8b5cf6',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/assets/images/doctor.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/assets/images/doctor.png',
        sizes: '256x256',
        type: 'image/png',
      },
      {
        src: '/assets/images/doctor.png',
        sizes: '384x384',
        type: 'image/png',
      },
      {
        src: '/assets/images/doctor.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    categories: ['healthcare', 'medical', 'productivity'],
    screenshots: [],
  };
}

