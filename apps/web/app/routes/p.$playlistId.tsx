import { createFileRoute } from '@tanstack/react-router'
import App from '~/App'
import { playlistSeoHead } from '~/lib/seo'

export const Route = createFileRoute('/p/$playlistId')({
  // Client-only: the app needs window/YouTube/localStorage and has nothing
  // meaningful to server-render. Avoids hydrating a lazy component into the
  // SPA shell's empty outlet (which caused a hydration mismatch).
  ssr: false,
  head: ({ params }) => playlistSeoHead(params.playlistId),
  component: App,
})
