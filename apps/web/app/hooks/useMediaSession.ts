import { useEffect, useRef } from 'react'
import { fetchOembedBatch } from '~/lib/http'

interface UseMediaSessionArgs {
  // The video currently loaded in the player, or null when nothing plays.
  videoId: string | null
  isPlaying: boolean
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrevious: () => void
}

const SILENCE_SECONDS = 10
const SAMPLE_RATE = 8000

/**
 * A silent looping WAV, built in memory. Chrome ignores clips shorter than
 * ~5s when picking which page owns the hardware media keys, and never routes
 * them to muted media — so the keep-alive has to be long and unmuted, with the
 * silence in the samples themselves.
 */
function createSilenceUrl() {
  const frames = SAMPLE_RATE * SILENCE_SECONDS
  const buffer = new ArrayBuffer(44 + frames)
  const view = new DataView(buffer)
  const ascii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i))
    }
  }

  ascii(0, 'RIFF')
  view.setUint32(4, 36 + frames, true)
  ascii(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE, true) // byte rate (8-bit mono)
  view.setUint16(32, 1, true) // block align
  view.setUint16(34, 8, true) // bits per sample
  ascii(36, 'data')
  view.setUint32(40, frames, true)
  new Uint8Array(buffer, 44).fill(128) // 8-bit PCM midpoint = silence

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

function isSupported() {
  if (typeof navigator === 'undefined') return false
  if (!('mediaSession' in navigator)) return false
  // iOS plays one audio stream at a time: a keep-alive track in this document
  // would fight the video inside the YouTube iframe.
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  return !isIos
}

/**
 * Wires the hardware media keys (play/pause, next, previous) and the OS media
 * controls to the playlist.
 *
 * Action handlers are only honoured while media is playing in *this* document,
 * and the video lives in a cross-origin YouTube iframe we can't reach into —
 * hence the silent keep-alive track, which exists purely to make this page the
 * one the keys are routed to. It starts only once a video is loaded, so an
 * empty playlist never takes the keys away from whatever else is playing.
 */
export function useMediaSession({
  videoId,
  isPlaying,
  onPlay,
  onPause,
  onNext,
  onPrevious,
}: UseMediaSessionArgs) {
  // Handlers are registered once; read the callbacks through a ref so they
  // never go stale and never force a re-registration.
  const actionsRef = useRef({ onPlay, onPause, onNext, onPrevious })
  actionsRef.current = { onPlay, onPause, onNext, onPrevious }

  const hasVideo = videoId !== null

  useEffect(() => {
    if (!hasVideo || !isSupported()) return

    const session = navigator.mediaSession
    const silenceUrl = createSilenceUrl()
    const keepAlive = new Audio(silenceUrl)
    keepAlive.loop = true
    let released = false

    const play = () => {
      if (released) return
      keepAlive.play().catch(() => {
        // Autoplay policy can reject until the next gesture; the listeners
        // below retry then.
      })
    }

    // Some browsers pause every player in the session on a pause action.
    // Resume, or we'd lose the keys right after the first press.
    const onKeepAlivePause = () => play()
    keepAlive.addEventListener('pause', onKeepAlivePause)

    document.addEventListener('pointerdown', play)
    document.addEventListener('keydown', play)
    play()

    const handlers: Array<[MediaSessionAction, () => void]> = [
      ['play', () => actionsRef.current.onPlay()],
      ['pause', () => actionsRef.current.onPause()],
      ['nexttrack', () => actionsRef.current.onNext()],
      ['previoustrack', () => actionsRef.current.onPrevious()],
    ]

    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler)
      } catch {
        // Unsupported action — the rest still register.
      }
    }

    return () => {
      released = true
      keepAlive.removeEventListener('pause', onKeepAlivePause)
      document.removeEventListener('pointerdown', play)
      document.removeEventListener('keydown', play)
      keepAlive.pause()
      keepAlive.src = ''
      URL.revokeObjectURL(silenceUrl)
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null)
        } catch {
          // ignore
        }
      }
      session.playbackState = 'none'
      session.metadata = null
    }
  }, [hasVideo])

  useEffect(() => {
    if (!hasVideo || !isSupported()) return
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
  }, [hasVideo, isPlaying])

  // Title and thumbnail for the OS media controls. Reuses the oembed cache the
  // playlist already fills, so this is usually a local lookup.
  useEffect(() => {
    if (!videoId || !isSupported()) return

    let cancelled = false
    fetchOembedBatch([videoId])
      .then((response) => {
        const info = response.videos?.[0]?.video
        if (cancelled || !info) return
        navigator.mediaSession.metadata = new MediaMetadata({
          title: info.title,
          artist: 'y2pilot',
          artwork: info.thumbUrl
            ? [{ src: info.thumbUrl, sizes: '480x360', type: 'image/jpeg' }]
            : [],
        })
      })
      .catch(() => {
        // Metadata is cosmetic; the keys work without it.
      })

    return () => {
      cancelled = true
    }
  }, [videoId])
}
