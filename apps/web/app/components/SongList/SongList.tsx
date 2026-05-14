import { useState, useEffect, useCallback, useRef } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import {
  Shuffle,
  GripVertical,
  SkipBack,
  SkipForward,
  X,
} from 'lucide-react'
import { textElipsis } from '~/lib/string'
import { fetchOembedBatch } from '~/lib/http'
import type { Song } from '~/hooks/usePlaylist'
import css from './SongList.module.css'

interface SongInfo {
  videoId: string
  title: string
  thumbUrl: string
  [key: string]: unknown
}

interface SongListProps {
  playlist: Song[]
  playlistIndex: number
  onShuffle: () => void
  onSelectedSongIndex: (index: number) => void
  onVideoInfoError: (videoId: string) => void
  onPlaylistOrderChange: (newPlaylist: Song[]) => void
  onPrevious: () => void
  onNext: () => void
  onRemoveSong: (videoId: string) => void
  notify: (opts: { text: string; type?: string; duration?: number }) => void
}

const stopProp = (e: React.DragEvent) => e.stopPropagation()

export default function SongList({
  playlist,
  playlistIndex,
  onShuffle,
  onSelectedSongIndex,
  onVideoInfoError,
  onPlaylistOrderChange,
  onPrevious,
  onNext,
  onRemoveSong,
  notify,
}: SongListProps) {
  const [songInfo, setSongInfo] = useState<Record<string, SongInfo>>({})
  const [playlistCopy, setPlaylistCopy] = useState<Song[]>([])
  const prevPlaylistRef = useRef<Song[]>([])

  useEffect(() => {
    // Only update when playlist actually changes
    if (prevPlaylistRef.current !== playlist) {
      prevPlaylistRef.current = playlist
      setPlaylistCopy([...playlist])
    }
  }, [playlist])

  // Fetch song info when playlistCopy changes
  useEffect(() => {
    if (!playlistCopy.length) return

    const videoIds = playlistCopy.map((v) => v.videoId)

    // Skip if we already have info for all videos
    const missingIds = videoIds.filter((id) => !songInfo[id])
    if (missingIds.length === 0) return

    fetchOembedBatch(videoIds)
      .then((response) => {
        const videos = response.videos || []
        const failedVideos = (response.failed || []) as Array<{ videoId: string }>

        failedVideos.forEach((fail) => {
          onVideoInfoError(fail.videoId)
        })

        if (failedVideos.length) {
          notify({
            text: "Unfortunately, some videos couldn't load. It may be because of geographic restrictions, video settings or the video doesn't exist anymore. Please try to use another link.",
            type: 'error',
            duration: 12000,
          })
        }

        setSongInfo((prev) => {
          const next = { ...prev }
          videos.forEach(
            (oembed: { videoId: string; video: SongInfo } | undefined) => {
              if (oembed) {
                next[oembed.videoId] = oembed.video
              }
            },
          )
          return next
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistCopy])

  const songNumber = playlistCopy.length

  const createTextElipsisDisplay = useCallback(
    (text: string) => textElipsis(text, 60),
    [],
  )

  const songThumbStyle = useCallback(
    (info: SongInfo) => ({
      backgroundImage: `url(${info.thumbUrl})`,
    }),
    [],
  )

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const items = Array.from(playlistCopy)
      const [moved] = items.splice(result.source.index, 1)
      items.splice(result.destination.index, 0, moved)
      setPlaylistCopy(items)
      onPlaylistOrderChange(items)
    },
    [playlistCopy, onPlaylistOrderChange],
  )

  return (
    <div
      className={css.editor}
      onDrag={stopProp}
      onDragStart={stopProp}
      onDragEnd={stopProp}
      onDragOver={stopProp}
      onDrop={stopProp}
      onDragEnter={stopProp}
      onDragLeave={stopProp}
    >
      <header className={css.header}>
        {songNumber > 0 && (
          <>
            <div className={css.playbackControls}>
              <button
                className={css.iconButton}
                onClick={onPrevious}
                title="Previous"
                aria-label="Previous"
              >
                <SkipBack size={22} />
              </button>
              <button
                className={css.iconButton}
                onClick={onNext}
                title="Next"
                aria-label="Next"
              >
                <SkipForward size={22} />
              </button>
              <div className={css.headerDivider} aria-hidden="true" />
              <button
                className={css.iconButton}
                onClick={onShuffle}
                title="Shuffle"
                aria-label="Shuffle"
              >
                <Shuffle size={22} />
              </button>
            </div>
          </>
        )}
      </header>

      {playlistCopy.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="playlist">
            {(provided) => (
              <ul
                className="list-group"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {playlistCopy.map((song, i) => (
                  <Draggable
                    key={song.videoId}
                    draggableId={song.videoId}
                    index={i}
                  >
                    {(dragProvided) => (
                      <li
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        className={`${css.songUrl} ${i === playlistIndex ? css.activeSongUrl : ''}`}
                        onClick={() => onSelectedSongIndex(i)}
                      >
                        <span
                          className={css.dragHandle}
                          {...dragProvided.dragHandleProps}
                        >
                          <GripVertical
                            className={css.dragHandleIcon}
                            size={18}
                          />
                          <span className={css.dragHandleIndex}>{i + 1}</span>
                        </span>
                        {songInfo[song.videoId] && (
                          <span
                            className={css.songThumb}
                            style={songThumbStyle(songInfo[song.videoId])}
                          />
                        )}
                        <span className={css.songTitle}>
                          {songInfo[song.videoId]
                            ? createTextElipsisDisplay(
                                songInfo[song.videoId].title,
                              )
                            : song.videoId}
                        </span>
                        <button
                          className={css.songRemove}
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveSong(song.videoId)
                          }}
                          title="Remove from playlist"
                          aria-label="Remove from playlist"
                        >
                          <X size={16} />
                        </button>
                      </li>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  )
}
