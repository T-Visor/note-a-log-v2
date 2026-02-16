import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Note-a-log',
    short_name: 'NAL',
    description: 'The self-organizing note-taking app',
    start_url: '/',
    scope: "https://note-a-log.vercel.app/",
    display: 'standalone',
    display_override: ["window-controls-overlay", "minimal-ui"],
    ...({
      handle_links: "preferred", // The new standard way
      launch_handler: {
        client_mode: ["focus-existing", "navigate-new"]
      }
    } as any),
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    // Adding screenshots resolves the "Richer UI" warning
    screenshots: [
      {
        src: '/screenshot-mobile.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Note-a-log Mobile'
      },
      {
        src: '/screenshot-desktop.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Note-a-log Desktop'
      }
    ]
  }
}