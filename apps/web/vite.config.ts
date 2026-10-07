import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tanstackStart({
      srcDirectory: 'app',
      // `/` is fully prerendered for crawlers; client-only routes (/p/*) get
      // the SPA shell, with playlist head tags added by public/_worker.js.
      spa: {
        // Must not be '/' (the shell would overwrite the prerendered index) and
        // must not match a route that renders its own SEO head on the server
        // (/p/$playlistId only does so on the client).
        maskPath: '/p/_shell',
        enabled: true,
        prerender: {
          outputPath: '/_shell',
        },
      },
      prerender: {
        enabled: true,
        crawlLinks: false,
        // Emit /help.html rather than /help/index.html so the canonical URL has no trailing slash.
        autoSubfolderIndex: false,
      },
      // Keep in sync with public/sitemap.xml (TanStack's generator emits an
      // invalid https:// sitemap namespace).
      pages: [{ path: '/' }, { path: '/help' }],
    }),
    viteReact(),
  ],
})
