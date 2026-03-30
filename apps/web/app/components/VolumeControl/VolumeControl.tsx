import { useEffect, useRef, useState, useCallback } from 'react'
import css from './VolumeControl.module.css'

interface VolumeControlProps {
  playerVolume: number
  onSetVolume: (volume: number) => void
  onStartedMouseTracking: () => void
  onStoppedMouseTracking: () => void
}

export default function VolumeControl({
  playerVolume,
  onSetVolume,
  onStartedMouseTracking,
  onStoppedMouseTracking,
}: VolumeControlProps) {
  const controlRef = useRef<HTMLDivElement>(null)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [hoveringOver, setHoveringOver] = useState(false)
  const [progressWidth, setProgressWidth] = useState(0)

  const onSetVolumeRef = useRef(onSetVolume)
  const onStoppedMouseTrackingRef = useRef(onStoppedMouseTracking)
  onSetVolumeRef.current = onSetVolume
  onStoppedMouseTrackingRef.current = onStoppedMouseTracking

  const getProgressWidth = useCallback(() => {
    if (!controlRef.current) return 0
    return (
      (playerVolume / 100) *
      controlRef.current.getBoundingClientRect().width
    )
  }, [playerVolume])

  useEffect(() => {
    setProgressWidth(getProgressWidth())
  }, [getProgressWidth])

  function getMouseEventRelativePosition(
    event: React.MouseEvent | MouseEvent,
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
    if (controlRef.current) {
      setHoverPosition(
        getMouseEventRelativePosition(event, controlRef.current),
      )
    }
  }

  function onMouseLeave() {
    setHoverPosition(0)
    setHoveringOver(false)
  }

  function onMouseDown(event: React.MouseEvent) {
    if (controlRef.current) {
      const relativePosition = getMouseEventRelativePosition(
        event,
        controlRef.current,
      )
      onSetVolume(relativePosition * 100)
    }

    onStartedMouseTracking()

    const onMouseMoveTrackAndUpdate = (e: MouseEvent) => {
      if (!controlRef.current) return
      const mouseViewportX = e.clientX
      const controlsClientRect =
        controlRef.current.getBoundingClientRect()
      const minControlsXPosition = controlsClientRect.left
      const maxControlsXPosition = controlsClientRect.right
      const normalizedMouseXPos =
        Math.max(
          Math.min(mouseViewportX, maxControlsXPosition),
          minControlsXPosition,
        ) - minControlsXPosition

      const relativeXPos = normalizedMouseXPos / controlsClientRect.width
      onSetVolumeRef.current(relativeXPos * 100)
    }

    const onWindowMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMoveTrackAndUpdate)
      window.removeEventListener('mouseup', onWindowMouseUp)
      onStoppedMouseTrackingRef.current()
    }

    window.addEventListener('mousemove', onMouseMoveTrackAndUpdate)
    window.addEventListener('mouseup', onWindowMouseUp)
  }

  return (
    <div
      className={css.control}
      ref={controlRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onMouseDown={onMouseDown}
    >
      <div className={css.bgOutline} />
      <div
        className={css.currentValue}
        style={{ width: `${progressWidth}px` }}
      />
      <div
        className={css.hoverLayer}
        style={{ width: `${hoverPosition * 100}%` }}
      />
    </div>
  )
}
