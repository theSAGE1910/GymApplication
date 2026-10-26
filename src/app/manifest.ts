import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Hevy Clone Workout Tracker',
        short_name: 'HevyClone',
        description: 'Offline-first gym workout logger, routine builder, and PR tracker.',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#0f172a',
        orientation: 'portrait',
        icons: [
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}