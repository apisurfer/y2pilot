import { useState, useEffect, useCallback, useRef } from 'react'
import { ThumbsUp } from 'lucide-react'
import { getYtUrls, getYtVideoId } from '~/lib/string'
import css from './DropArea.module.css'

interface DropAreaProps {
  onDropMode: (dropMode: boolean) => void
  onDroppedSongs: (songs: Array<{ videoId: string }>) => void
}

export default function DropArea({ onDropMode, onDroppedSongs }: DropAreaProps) {
  const [dropMode, setDropMode] = useState(false)
  const onDropModeRef = useRef(onDropMode)
  onDropModeRef.current = onDropMode

  useEffect(() => {
    onDropModeRef.current(dropMode)
  }, [dropMode])

  // Global dragenter listener to show drop area
  useEffect(() => {
    const onDragEnter = () => setDropMode(true)
    document.addEventListener('dragenter', onDragEnter)
    return () => document.removeEventListener('dragenter', onDragEnter)
  }, [])

  const handleDroppedUrls = useCallback(
    (urls: string[]) => {
      const songList = urls.map((url) => {
        const videoId = getYtVideoId(url)
        return { videoId: videoId || '' }
      }).filter(s => s.videoId)
      onDroppedSongs(songList)
    },
    [onDroppedSongs],
  )

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setDropMode(false)

      if (!event.dataTransfer) return

      const eventText = event.dataTransfer.getData('text/plain')
      let ytUrls = getYtUrls(eventText)

      if (ytUrls.length) {
        handleDroppedUrls(ytUrls)
        return
      }

      // Try another approach: collect links from event HTML (img/a tags from dropped content)
      const eventHtml = event.dataTransfer.getData('text/html')
      const mockEl = document.createElement('div')
      mockEl.innerHTML = eventHtml
      const urls: string[] = []

      mockEl
        .querySelectorAll('img')
        .forEach((i) => urls.push(i.getAttribute('src') || ''))
      mockEl
        .querySelectorAll('a')
        .forEach((a) => urls.push(a.getAttribute('href') || ''))

      ytUrls = urls
        .map((url) => {
          const match = url?.match(
            /^https:\/\/i.ytimg.com\/[a-zA-Z0-9_]+\/([A-Za-z0-9_-]{11})/,
          )
          return match && match[1]
        })
        .filter(Boolean)
        .map((vId) => `https://www.youtube.com/watch?v=${vId}`)

      if (ytUrls.length) {
        handleDroppedUrls(ytUrls)
      }
    },
    [handleDroppedUrls],
  )

  return (
    <>
      <div
        className={`${css.dropArea} ${dropMode ? css.show : ''}`}
        onDrop={onDrop}
        onDragEnter={(e) => {
          e.preventDefault()
          setDropMode(true)
        }}
        onDragLeave={(e) => {
          e.preventDefault()
          setDropMode(false)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDropMode(true)
        }}
      >
        <div className={css.message}>
          <ThumbsUp size={160} />
          <span>Drop it like it's </span>
          <span className={css.oversize}>HOT!</span>
        </div>
      </div>
    </>
  )
}
