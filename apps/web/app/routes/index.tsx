import { createFileRoute, redirect } from '@tanstack/react-router'
import App from '~/App'

export const Route = createFileRoute('/')({
  // Client-only (see /p/$playlistId) — the app renders purely on the client.
  ssr: false,
  // Legacy share links used /?p=:playlistId. Redirect them to /p/:playlistId.
  validateSearch: (search: Record<string, unknown>): { p?: string } =>
    typeof search.p === 'string' && search.p ? { p: search.p } : {},
  beforeLoad: ({ search }) => {
    if (search.p) {
      throw redirect({
        to: '/p/$playlistId',
        params: { playlistId: search.p },
        replace: true,
      })
    }
  },
  component: App,
})
