import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import App from '~/App'
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, seoHead } from '~/lib/seo'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'y2pilot',
  url: `${SITE_URL}/`,
  description: SITE_DESCRIPTION,
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
}

export const Route = createFileRoute('/')({
  // Prerendered at build time so crawlers get the landing content.
  head: () => ({
    ...seoHead({ path: '/', title: SITE_TITLE, description: SITE_DESCRIPTION }),
    scripts: [
      { type: 'application/ld+json', children: JSON.stringify(jsonLd) },
    ],
  }),
  // Legacy share links used /?p=:playlistId. Parse it so we can redirect.
  validateSearch: (search: Record<string, unknown>): { p?: string } =>
    typeof search.p === 'string' && search.p ? { p: search.p } : {},
  component: IndexRoute,
})

function IndexRoute() {
  const { p } = Route.useSearch()
  const navigate = useNavigate()

  // Redirect legacy /?p=:id links on the client. Keep rendering <App /> until
  // then so the markup matches the prerendered HTML during hydration.
  useEffect(() => {
    if (p) {
      navigate({ to: '/p/$playlistId', params: { playlistId: p }, replace: true })
    }
  }, [p, navigate])

  return <App />
}
