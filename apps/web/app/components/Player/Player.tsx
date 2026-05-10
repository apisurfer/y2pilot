import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react'
import css from './Player.module.css'

const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  VIDEO_CUED: 5,
}

export interface PlayerHandle {
  play(): void
  pause(): void
  seek(seconds: number, allowSeekAhead?: boolean): void
  mute(): void
  unmute(): void
  isMuted(): boolean
  setVolume(volume: number): void
  getVolume(): number
}

interface PlayerProps {
  videoId: string
  startSeconds?: number
  endSeconds?: number
  halfScreen?: boolean
  className?: string
  onEnded?: () => void
  onPlaying?: () => void
  onReady?: () => void
  onPaused?: () => void
  onDuration?: (duration: number) => void
  onCurrentTime?: (time: number) => void
  onError?: (videoId: string) => void
}

function playSlice(
  player: YT.Player,
  videoId: string,
  startSeconds?: number,
  endSeconds?: number,
) {
  const apiOptions: { videoId: string; startSeconds?: number; endSeconds?: number } = {
    videoId,
    startSeconds: startSeconds ?? 0,
  }
  if (endSeconds) {
    apiOptions.endSeconds = endSeconds
  }
  player.loadVideoById(apiOptions)
}

const Player = forwardRef<PlayerHandle, PlayerProps>(function Player(
  {
    videoId,
    startSeconds = 0,
    endSeconds,
    halfScreen = false,
    className,
    onEnded,
    onPlaying,
    onReady,
    onPaused,
    onDuration,
    onCurrentTime,
    onError,
  },
  ref,
) {
  // Container that React owns. YT replaces a child element with an iframe,
  // so we never let React directly manage the element YT touches — otherwise
  // unmount throws "removeChild ... not a child" when the iframe replaced
  // the original node.
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const initializedRef = useRef(false)
  const sdkIntervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  // Keep callback refs to avoid stale closures in YT event handlers
  const onEndedRef = useRef(onEnded)
  const onPlayingRef = useRef(onPlaying)
  const onReadyRef = useRef(onReady)
  const onPausedRef = useRef(onPaused)
  const onDurationRef = useRef(onDuration)
  const onCurrentTimeRef = useRef(onCurrentTime)
  const onErrorRef = useRef(onError)
  const videoIdRef = useRef(videoId)
  const startSecondsRef = useRef(startSeconds)
  const endSecondsRef = useRef(endSeconds)

  onEndedRef.current = onEnded
  onPlayingRef.current = onPlaying
  onReadyRef.current = onReady
  onPausedRef.current = onPaused
  onDurationRef.current = onDuration
  onCurrentTimeRef.current = onCurrentTime
  onErrorRef.current = onError
  videoIdRef.current = videoId
  startSecondsRef.current = startSeconds
  endSecondsRef.current = endSeconds

  useImperativeHandle(ref, () => ({
    play() {
      playerRef.current?.playVideo()
    },
    pause() {
      playerRef.current?.pauseVideo()
    },
    seek(seconds: number, allowSeekAhead = true) {
      playerRef.current?.seekTo(seconds, allowSeekAhead)
    },
    mute() {
      playerRef.current?.mute()
    },
    unmute() {
      playerRef.current?.unMute()
    },
    isMuted() {
      return playerRef.current?.isMuted?.() ?? false
    },
    setVolume(volume: number) {
      playerRef.current?.setVolume(volume)
    },
    getVolume() {
      return playerRef.current?.getVolume?.() ?? 0
    },
  }))

  // Start progress reporting
  const startProgress = () => {
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
    progressIntervalRef.current = setInterval(() => {
      if (playerRef.current) {
        onDurationRef.current?.(playerRef.current.getDuration?.() ?? 0)
        onCurrentTimeRef.current?.(playerRef.current.getCurrentTime?.() ?? 0)
      }
    }, 500)
  }

  // Load SDK and initialize player (once)
  useEffect(() => {
    // Create a detached target node inside our container. YT will replace
    // this node with an iframe; React will not try to reconcile it.
    const target = document.createElement('div')
    containerRef.current?.appendChild(target)

    // Load the YT IFrame API script
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const tag = document.createElement('script')
      const firstScriptTag = document.getElementsByTagName('script')[0]
      tag.src = 'https://www.youtube.com/iframe_api'
      firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag)
    }

    // Poll for SDK readiness
    sdkIntervalRef.current = setInterval(() => {
      if (window.YT && window.YT.Player && !initializedRef.current) {
        initializedRef.current = true
        clearInterval(sdkIntervalRef.current)

        const player = new window.YT.Player(target, {
          events: {
            onReady: () => {
              playSlice(
                player,
                videoIdRef.current,
                startSecondsRef.current,
                endSecondsRef.current,
              )
              player.seekTo(startSecondsRef.current ?? 0, true)
              startProgress()
              onReadyRef.current?.()
            },
            onError: (event) => {
              onErrorRef.current?.(videoIdRef.current)
              console.error(videoIdRef.current, event)
            },
            onStateChange: (event) => {
              switch (event.data) {
                case PLAYER_STATE.ENDED:
                  onEndedRef.current?.()
                  break
                case PLAYER_STATE.PLAYING:
                  onPlayingRef.current?.()
                  break
                case PLAYER_STATE.PAUSED:
                  onPausedRef.current?.()
                  break
              }
            },
            onPlaybackQualityChange: () => {},
            onPlaybackRateChange: () => {},
            onApiChange: () => {},
          },
        })
        playerRef.current = player
      }
    }, 250)

    return () => {
      if (sdkIntervalRef.current) clearInterval(sdkIntervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      try {
        playerRef.current?.destroy?.()
      } catch {
        // ignore — iframe may already be gone
      }
      playerRef.current = null
      initializedRef.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // React to videoId / startSeconds changes (re-play current slice)
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      playSlice(playerRef.current, videoId, startSeconds, endSeconds)
      playerRef.current.seekTo(startSeconds ?? 0, true)
      startProgress()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, startSeconds])

  return (
    <div
      ref={containerRef}
      className={`${css.player} ${halfScreen ? css.halfScreen : css.fullScreen} ${className || ''}`}
    />
  )
})

export default Player
