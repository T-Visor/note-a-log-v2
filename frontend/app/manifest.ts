import type { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Note-a-log',
    short_name: 'NAL',
    description: 'The self-organizing note-taking app',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon0.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon1.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}