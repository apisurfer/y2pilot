import { useCallback, useEffect, useRef } from 'react'

/**
 * Screen Wake Lock keeps the device screen awake during playback — mainly for
 * mobile, where the screen would otherwise dim and sleep mid-video.
 *
 * The browser auto-releases the lock whenever the page becomes hidden (tab
 * switch, lock screen, app backgrounded), so we remember whether we *want* the
 * lock and re-acquire it on `visibilitychange` once the page is visible again.
 */
export function useWakeLock() {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)
  // Whether playback currently wants the screen kept awake.
  const wantLockRef = useRef(false)

  const request = useCallback(async () => {
    wantLockRef.current = true
    if (!('wakeLock' in navigator)) return
    // The request only succeeds while the page is visible.
    if (document.visibilityState !== 'visible') return
    if (sentinelRef.current) return
    try {
      const sentinel = await navigator.wakeLock.request('screen')
      sentinelRef.current = sentinel
      // The system may drop the lock on its own; clear our ref so the next
      // visibility change (or play) can re-acquire it.
      sentinel.addEventListener('release', () => {
        if (sentinelRef.current === sentinel) sentinelRef.current = null
      })
    } catch {
      // Can reject (e.g. low battery, permission policy) — playback continues.
    }
  }, [])

  const release = useCallback(async () => {
    wantLockRef.current = false
    const sentinel = sentinelRef.current
    sentinelRef.current = null
    try {
      await sentinel?.release()
    } catch {
      // ignore — already released
    }
  }, [])

  useEffect(() => {
    const onVisibilityChange = () => {
      if (wantLockRef.current && document.visibilityState === 'visible') {
        void request()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      void release()
    }
  }, [request, release])

  return { request, release }
}
