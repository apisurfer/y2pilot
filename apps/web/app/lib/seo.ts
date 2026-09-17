export const SITE_URL = 'https://y2pilot.com'
export const SITE_TITLE = 'y2pilot – Instantly shareable YouTube playlists'
export const SITE_DESCRIPTION =
  'Create and share YouTube playlists instantly. No account required, non-stop playback, looping and shuffle. Just paste or drop YouTube links and play. Free.'

// Root-level defaults. Routes without seoHead() (e.g. shared playlists) stay
// out of the index but still get a proper link preview; deeper routes win.
export const defaultSeoMeta = [
  { title: SITE_TITLE },
  { name: 'description', content: SITE_DESCRIPTION },
  { name: 'robots', content: 'noindex' },
  { property: 'og:type', content: 'website' },
  { property: 'og:site_name', content: 'y2pilot' },
  { property: 'og:title', content: SITE_TITLE },
  { property: 'og:description', content: SITE_DESCRIPTION },
  { name: 'twitter:card', content: 'summary' },
]

interface PageSeo {
  path: string
  title: string
  description: string
}

export function seoHead({ path, title, description }: PageSeo) {
  const url = `${SITE_URL}${path}`
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'robots', content: 'index, follow' },
      { property: 'og:url', content: url },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
    ],
    links: [{ rel: 'canonical', href: url }],
  }
}
