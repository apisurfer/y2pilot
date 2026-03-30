import { useState } from 'react'
import {
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Trash2,
} from 'lucide-react'
import ProgressBar from '~/components/ProgressBar/ProgressBar'
import VolumeControl from '~/components/VolumeControl/VolumeControl'
import css from './Controls.module.css'

interface ControlsProps {
  duration: number
  currentTime: number
  playing: boolean
  playerVolume: number
  muted: boolean
  onPrevious: () => void
  onNext: () => void
  onRemove: () => void
  onSeek: (time: number) => void
  onPlay: () => void
  onPause: () => void
  onSetVolume: (volume: number) => void
  onMute: () => void
  onUnmute: () => void
  onStartedMouseTracking: () => void
  onStoppedMouseTracking: () => void
}

export default function Controls({
  duration,
  currentTime,
  playing,
  playerVolume,
  muted,
  onPrevious,
  onNext,
  onRemove,
  onSeek,
  onPlay,
  onPause,
  onSetVolume,
  onMute,
  onUnmute,
  onStartedMouseTracking,
  onStoppedMouseTracking,
}: ControlsProps) {
  const [isVolumeMouseTracking, setIsVolumeMouseTracking] = useState(false)

  function handleStartedMouseTracking() {
    setIsVolumeMouseTracking(true)
    onStartedMouseTracking()
  }

  function handleStoppedMouseTracking() {
    setIsVolumeMouseTracking(false)
    onStoppedMouseTracking()
  }

  return (
    <div
      className={`${css.controls} ${isVolumeMouseTracking ? 'no-pointer-events' : ''}`}
    >
      <div className={css.fastNav}>
        <ProgressBar
          duration={duration}
          currentTime={currentTime}
          onSeek={onSeek}
        />
      </div>

      <div className={css.mainControlButtons}>
        <div className={css.firstControlSection}>
          <button onClick={onPrevious}>
            <SkipBack size={35} />
          </button>
          <button onClick={onNext}>
            <SkipForward size={35} />
          </button>

          {playing ? (
            <button onClick={onPause}>
              <Pause size={35} />
            </button>
          ) : (
            <button onClick={onPlay}>
              <Play size={35} />
            </button>
          )}

          {muted ? (
            <button onClick={onUnmute}>
              <VolumeX size={35} />
            </button>
          ) : (
            <button onClick={onMute}>
              <Volume2 size={35} />
            </button>
          )}

          <VolumeControl
            onSetVolume={onSetVolume}
            onStartedMouseTracking={handleStartedMouseTracking}
            onStoppedMouseTracking={handleStoppedMouseTracking}
            playerVolume={playerVolume}
          />
        </div>

        <div className={css.playlistControlSection}>
          <button onClick={onRemove}>
            <Trash2 size={35} />
          </button>
        </div>
      </div>
    </div>
  )
}
