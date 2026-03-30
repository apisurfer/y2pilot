import { useRef, useState } from 'react'
import css from './ProgressBar.module.css'

function padWithZero(num: number, width = 2): string {
  const s = String(num)
  return s.length >= width
    ? s
    : new Array(width - s.length + 1).join('0') + s
}

interface ProgressBarProps {
  duration: number
  currentTime: number
  onSeek: (time: number) => void
}

export default function ProgressBar({
  duration,
  currentTime,
  onSeek,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [hoveringOver, setHoveringOver] = useState(false)

  const currentTimeString = (() => {
    if (!currentTime) return ''
    const remainingTime = duration - currentTime
    const seconds = Math.floor(remainingTime % 60)
    if (remainingTime <= 60) {
      return `${seconds}s`
    } else if (remainingTime < 3600) {
      const minutes = Math.round((remainingTime - seconds) / 60)
      return `${minutes}m ${seconds}s`
    } else {
      const hours = Math.floor(remainingTime / 3600)
      const minutes = Math.round((remainingTime - seconds - hours * 3600) / 60)
      return `${hours}h ${minutes}m ${seconds}s`
    }
  })()

  const hoveredTime = (() => {
    const time = duration * hoverPosition
    const seconds = Math.floor(time % 60)
    if (time < 3600) {
      const minutes = Math.round((time - seconds) / 60)
      return `${padWithZero(minutes)}:${padWithZero(seconds)}`
    } else {
      const hours = Math.floor(time / 3600)
      const minutes = Math.round((time - seconds - hours * 3600) / 60)
      return `${hours}:${padWithZero(minutes)}:${padWithZero(seconds)}`
    }
  })()

  function getMouseEventRelativePosition(
    event: React.MouseEvent,
    element: HTMLElement,
  ) {
    const bbox = element.getBoundingClientRect()
    let eventPositionOffset = Math.round(
      event.pageX - (window.pageXOffset + bbox.left),
    )
    eventPositionOffset = Math.max(0, eventPositionOffset)
    eventPositionOffset = Math.min(bbox.width, eventPositionOffset)
    return eventPositionOffset / bbox.width
  }

  function onMouseMove(event: React.MouseEvent) {
    setHoveringOver(true)
    if (barRef.current) {
      setHoverPosition(
        getMouseEventRelativePosition(event, barRef.current),
      )
    }
  }

  function onMouseLeave() {
    setHoverPosition(0)
    setHoveringOver(false)
  }

  function onMouseUp(event: React.MouseEvent) {
    if (barRef.current) {
      const relativePosition = getMouseEventRelativePosition(
        event,
        barRef.current,
      )
      onSeek(relativePosition * duration)
    }
  }

  function progressWidth() {
    if (!barRef.current) return 0
    return (
      (currentTime / duration) *
      barRef.current.getBoundingClientRect().width
    )
  }

  const relPosition = Math.max(Math.min(hoverPosition, 0.92), 0.08)

  return (
    <div
      className={css.bar}
      ref={barRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseUp={onMouseUp}
    >
      <div
        className={css.progress}
        style={{ width: `${progressWidth()}px` }}
      />
      <div
        className={css.hoverLayer}
        style={{ width: `${hoverPosition * 100}%` }}
      />
      <div className={css.timing}>{currentTimeString}</div>
      <div
        className={css.hoverTiming}
        style={{
          left: `${relPosition * 100}%`,
          visibility: hoveringOver ? 'visible' : 'hidden',
        }}
      >
        {hoveredTime}
      </div>
    </div>
  )
}
