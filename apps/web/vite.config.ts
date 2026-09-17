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
      // `/` is fully prerendered for crawlers; client-only routes (/p/*) fall
      // back to the SPA shell via public/_redirects.
      spa: {
        // Must not be '/' (the shell would overwrite the prerendered index) and
        // must not match a route with its own SEO head.
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
