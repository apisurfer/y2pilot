declare namespace YT {
  interface Player {
    playVideo(): void
    pauseVideo(): void
    stopVideo(): void
    seekTo(seconds: number, allowSeekAhead?: boolean): void
    mute(): void
    unMute(): void
    isMuted(): boolean
    setVolume(volume: number): void
    getVolume(): number
    getVideoLoadedFraction(): number
    getPlayerState(): number
    getCurrentTime(): number
    getDuration(): number
    getVideoUrl(): string
    getIframe(): HTMLIFrameElement
    destroy(): void
    loadVideoById(options: {
      videoId: string
      startSeconds?: number
      endSeconds?: number
    }): void
  }

  interface PlayerEvent {
    data: number
    target: Player
  }

  interface PlayerOptions {
    events?: {
      onReady?: () => void
      onError?: (event: PlayerEvent) => void
      onStateChange?: (event: PlayerEvent) => void
      onPlaybackQualityChange?: () => void
      onPlaybackRateChange?: () => void
      onApiChange?: () => void
    }
  }
}

interface Window {
  YT?: {
    Player: new (
      element: string | HTMLElement,
      options?: YT.PlayerOptions,
    ) => YT.Player
  }
}

declare module '*.module.css' {
  const classes: { readonly [key: string]: string }
  export default classes
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}
