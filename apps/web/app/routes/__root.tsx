/// <reference types="vite/client" />
import type { ReactNode } from 'react'
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from '@tanstack/react-router'
import { NotificationProvider } from '~/components/Notifications'
import ErrorBoundary from '~/components/ErrorBoundary/ErrorBoundary'
import globalCss from '~/global.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'y2pilot.com' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;700&display=swap',
      },
      { rel: 'stylesheet', href: globalCss },
    ],
    scripts: [
      {
        src: 'https://www.googletagmanager.com/gtag/js?id=G-9WCVX84D35',
        async: true,
      },
      {
        children: `
          window.dataLayer = window.dataLayer || [];
          function gtag() { dataLayer.push(arguments); }
          gtag('js', new Date());
          gtag('config', 'G-9WCVX84D35');
        `,
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ErrorBoundary>
          <NotificationProvider>{children}</NotificationProvider>
        </ErrorBoundary>
        <Scripts />
      </body>
    </html>
  )
}
