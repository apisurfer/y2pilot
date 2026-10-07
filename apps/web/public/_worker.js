// Cloudflare Pages worker, limited to /p/* by _routes.json. Serves the SPA
// shell with per-playlist head tags so crawlers and link previews get real
// metadata without running the app, and missing playlists return a real 404.
// Keep the tags in sync with playlistSeoHead() in app/lib/seo.ts, which
// re-renders them on the client.

const SITE_URL = 'https://y2pilot.com'
const API_TIMEOUT_MS = 3000

const escapeHtml = (value) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

// Resolves to the playlist, null when it doesn't exist, or undefined when we
// couldn't find out (API unreachable or not configured).
async function fetchPlaylist(env, id) {
  if (!env.VITE_WORKER_URL) return undefined
  try {
    const res = await fetch(`${env.VITE_WORKER_URL}/playlists/${id}`, {
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    })
    if (res.status === 404) return null
    if (!res.ok) return undefined
    return await res.json()
  } catch {
    return undefined
  }
}

function playlistSeo(playlist) {
  const name = (playlist.name || '').trim()
  const prefix = [(playlist.emoji || '').trim(), name].filter(Boolean).join(' ')
  const count = playlist.videoIds.length
  const videos = `${count} ${count === 1 ? 'video' : 'videos'}`
  const subject = name
    ? `"${name}", a YouTube playlist of ${videos},`
    : `this YouTube playlist of ${videos}`
  return {
    id: playlist.id,
    title: `${prefix || 'YouTube playlist'} - y2pilot`,
    description: `Play ${subject} non-stop on y2pilot. Loop, shuffle and share it instantly, no account required.`,
  }
}

const setContent = (content) => ({
  element: (el) => el.setAttribute('content', content),
})

function withPlaylistHead(shell, seo) {
  const url = `${SITE_URL}/p/${seo.id}`
  const title = escapeHtml(seo.title)
  const description = escapeHtml(seo.description)
  const extraHead = [
    `<meta property="og:url" content="${url}"/>`,
    `<meta name="twitter:title" content="${title}"/>`,
    `<meta name="twitter:description" content="${description}"/>`,
    `<link rel="canonical" href="${url}"/>`,
    `<script>window.__PLAYLIST_SEO__=${JSON.stringify(seo).replace(/</g, '\\u003c')}</script>`,
  ].join('')

  return new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(seo.title) })
    .on('meta[name="description"]', setContent(seo.description))
    .on('meta[name="robots"]', setContent('index, follow'))
    .on('meta[property="og:title"]', setContent(seo.title))
    .on('meta[property="og:description"]', setContent(seo.description))
    .on('head', { element: (el) => el.append(extraHead, { html: true }) })
    .transform(shell)
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const match = url.pathname.match(/^\/p\/([\w-]+)\/?$/)
    const isRead = request.method === 'GET' || request.method === 'HEAD'
    if (!match || !isRead) return env.ASSETS.fetch(request)

    const [shell, playlist] = await Promise.all([
      env.ASSETS.fetch(new URL('/_shell', url)),
      fetchPlaylist(env, match[1]),
    ])

    // Unknown: keep the shell's noindex defaults so the app still loads.
    if (playlist === undefined) return shell

    const headers = new Headers(shell.headers)
    // The body now varies per playlist, so the shell's validator no longer applies.
    headers.delete('etag')

    if (playlist === null) {
      return new Response(shell.body, { status: 404, headers })
    }

    return withPlaylistHead(
      new Response(shell.body, { status: shell.status, headers }),
      playlistSeo(playlist),
    )
  },
}
