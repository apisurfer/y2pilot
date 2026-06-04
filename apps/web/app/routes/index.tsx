import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import App from '~/App'

export const Route = createFileRoute('/')({
  // Client-only (see /p/$playlistId) — the app renders purely on the client.
  ssr: false,
  // Legacy share links used /?p=:playlistId. Parse it so we can redirect.
  validateSearch: (search: Record<string, unknown>): { p?: string } =>
    typeof search.p === 'string' && search.p ? { p: search.p } : {},
  component: IndexRoute,
})

function IndexRoute() {
  const { p } = Route.useSearch()
  const navigate = useNavigate()

  // Redirect legacy /?p=:id links to /p/:id on the client (doing it in
  // beforeLoad would run during SSR and cause a hydration mismatch on the
  // redirect transition). Render nothing while the redirect is pending.
  useEffect(() => {
    if (p) {
      navigate({ to: '/p/$playlistId', params: { playlistId: p }, replace: true })
    }
  }, [p, navigate])

  if (p) return null
  return <App />
}
