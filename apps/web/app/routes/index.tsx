import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import AppHeader from '~/components/AppHeader/AppHeader'
import Player, { type PlayerHandle } from '~/components/Player/Player'
import Controls from '~/components/Controls/Controls'
import DropArea from '~/components/DropArea/DropArea'
import SongList from '~/components/SongList/SongList'
import HowTo from '~/components/HowTo/HowTo'
import HelpScreen from '~/components/HelpScreen/HelpScreen'
import ConfirmModal from '~/components/ConfirmModal/ConfirmModal'
import SharePlaylistModal from '~/components/SharePlaylistModal/SharePlaylistModal'
import { useNotify } from '~/components/Notifications'
import { usePlaylist } from '~/hooks/usePlaylist'
import { getYtVideoId, getYtUrls, getSearchParam } from '~/lib/string'
import { fetchPlaylist as fetchPlaylistApi, createPlaylist } from '~/lib/http'
import {
  savePlaylist as savePlaylistToLS,
  getPlaylist as getPlaylistFromLS,
} from '~/lib/localstorage'

export const Route = createFileRoute('/')({
  component: App,
})

interface VideoSlice {
  videoId: string
  startSeconds: number
  endSeconds?: number
}

const stages = {
  INTRO: 'intro',
  PLAYING: 'playing',
  PLAYLIST: 'playlist',
  HELP: 'help',
} as const

type Stage = (typeof stages)[keyof typeof stages]

function App() {
  const notify = useNotify()
  const playerRef = useRef<PlayerHandle>(null)

  const {
    playlist,
    playlistIndex,
    playlistAddSongs,
    playlistRemoveSong,
    playlistClear,
    playlistSetIndex,
    playlistPrevious,
    playlistNext,
    playlistShuffle,
    playlistChangeOrder,
    playlistGetCurrentSong,
    playlistGetLength,
  } = usePlaylist()

  const [videoSlice, setVideoSlice] = useState<VideoSlice | null>(null)
  const [dropMode, setDropMode] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [playerVolume, setPlayerVolume] = useState(0)
  const [muted, setMuted] = useState(false)
  const [showStage, setShowStage] = useState<Stage>(stages.INTRO)
  const [showPlaylistRemoveConfirmation, setShowPlaylistRemoveConfirmation] =
    useState(false)
  const [showPlaylistShareModal, setShowPlaylistShareModal] = useState(false)
  const [playlistURL, setPlaylistURL] = useState('')
  const [disablePlayerPointerEvents, setDisablePlayerPointerEvents] =
    useState(false)

  // Refs for values used in event handlers to avoid stale closures
  const videoSliceRef = useRef(videoSlice)
  const disablePlayerPointerEventsRef = useRef(disablePlayerPointerEvents)
  const showStageRef = useRef(showStage)
  videoSliceRef.current = videoSlice
  disablePlayerPointerEventsRef.current = disablePlayerPointerEvents
  showStageRef.current = showStage

  // --- Derived state ---
  const isPlaylistOpen = showStage === stages.PLAYLIST

  // --- Set current video slice based on playlist state ---
  const setCurrentVideoSlice = useCallback(() => {
    if (!playlist.length) {
      setVideoSlice(null)
      setShowStage(stages.INTRO)
      return
    }

    setShowStage((prev) =>
      prev === stages.INTRO ? stages.PLAYING : prev,
    )

    const currentSong = playlist[playlistIndex]
    if (currentSong) {
      setVideoSlice({
        videoId: currentSong.videoId,
        startSeconds: 0,
      })
    }
  }, [playlist, playlistIndex])

  // Watch playlist/playlistIndex changes
  useEffect(() => {
    setCurrentVideoSlice()
    savePlaylistToLS(playlist, playlistIndex)
  }, [playlist, playlistIndex, setCurrentVideoSlice])

  // Reset currentTime when playlist index changes
  const prevPlaylistIndex = useRef(playlistIndex)
  useEffect(() => {
    if (prevPlaylistIndex.current !== playlistIndex) {
      prevPlaylistIndex.current = playlistIndex
      setCurrentTime(0)
    }
  }, [playlistIndex])

  // --- Mount: Load playlist from URL param or localStorage ---
  const mountedRef = useRef(false)
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const playlistId = getSearchParam(window.location.href, 'p')
    if (playlistId) {
      fetchPlaylistApi(playlistId)
        .then((response: { videoIds: string[] }) => {
          const songlistObjects = response.videoIds.map((id: string) => ({
            videoId: id,
          }))
          playlistAddSongs(songlistObjects)
          playlistSetIndex(0)
        })
        .catch(() => {
          loadPlaylistFromLocalStorage()
        })
    } else {
      loadPlaylistFromLocalStorage()
    }

    function loadPlaylistFromLocalStorage() {
      const { songList, index } = getPlaylistFromLS()
      const songlistObjects = songList.map((videoId: string) => ({ videoId }))
      playlistAddSongs(songlistObjects)
      playlistSetIndex(index)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Volume polling ---
  useEffect(() => {
    const interval = setInterval(() => {
      if (playerRef.current) {
        setPlayerVolume(playerRef.current.getVolume())
        setMuted(playerRef.current.isMuted())
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // --- Before unload warning ---
  useEffect(() => {
    if (window.location.href.includes('http://localhost')) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Sure?'
      return 'Sure?'
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  // --- Page focus / visibility management ---
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        setDisablePlayerPointerEvents(true)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  // Polling for lost focus (handles window switching via kbd shortcuts)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hasFocus() || document.visibilityState === 'hidden') {
        setDisablePlayerPointerEvents(true)
      }
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // --- Global drag/drop prevention and mouse events ---
  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault()
    document.addEventListener('dragenter', prevent)
    document.addEventListener('dragover', prevent)

    const onDrop = () => setDisablePlayerPointerEvents(false)

    const onMouseLeave = () => setDisablePlayerPointerEvents(true)

    const onMouseOut = (e: MouseEvent) => {
      const from = e.relatedTarget as Node | null
      if (!from || (from as Element).nodeName === 'HTML') {
        setDisablePlayerPointerEvents(true)
      }
    }

    const onMouseEnter = (e: MouseEvent) => {
      if (!videoSliceRef.current) return
      if (e instanceof DragEvent) {
        setDisablePlayerPointerEvents(true)
      } else {
        setDisablePlayerPointerEvents(false)
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (!videoSliceRef.current) return
      if (e instanceof DragEvent) {
        setDisablePlayerPointerEvents(true)
      } else {
        setDisablePlayerPointerEvents(false)
      }
    }

    document.addEventListener('drop', onDrop)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseout', onMouseOut)
    document.addEventListener('mouseenter', onMouseEnter)
    document.addEventListener('mousemove', onMouseMove)

    return () => {
      document.removeEventListener('dragenter', prevent)
      document.removeEventListener('dragover', prevent)
      document.removeEventListener('drop', onDrop)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseout', onMouseOut)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  // --- Global paste handler ---
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      // Don't handle paste from input elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const eventText = e.clipboardData?.getData('text')
      if (!eventText) return

      const ytUrls = getYtUrls(eventText)
      const videoIds = ytUrls.map(getYtVideoId)
      const ytVideos = videoIds
        .filter(Boolean)
        .map((vId) => ({ videoId: vId as string }))
      const addedCount = playlistAddSongs(ytVideos)
      notify({ text: `${addedCount} video URLs appended!` })
      setDisablePlayerPointerEvents(false)
    }

    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [playlistAddSongs, notify])

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
        playlistShuffle()
        return
      }
      if (e.key === '?') {
        handleShowHelp()
        return
      }
      if (e.key === 'ArrowLeft') {
        playlistPrevious()
        return
      }
      if (e.key === 'ArrowRight') {
        playlistNext()
        return
      }
      if (e.key === 'Escape') {
        handleShowPlaying()
        return
      }
      if (e.key === '1') {
        handleUpcomingSelected(1)
        return
      }
      if (e.key === '2') {
        handleUpcomingSelected(2)
        return
      }
      if (e.key === '3') {
        handleUpcomingSelected(3)
        return
      }
      if (e.key === 'p' || e.key === 'P') {
        handleShowPlaylist()
        return
      }
    }

    document.addEventListener('keyup', onKeyUp)
    return () => document.removeEventListener('keyup', onKeyUp)
  })

  // --- Event handlers ---

  function handleDropModeChange(mode: boolean) {
    setDropMode(mode)
  }

  function handleDroppedSongs(ytUrls: Array<{ videoId: string }> = []) {
    const addedCount = playlistAddSongs(ytUrls)
    notify({ text: `${addedCount} video URLs appended!` })
  }

  function handleAddVideoIdsThroughInput(videoIds: string[] = []) {
    const ytUrls = videoIds.map((vId) => ({ videoId: vId }))
    const addedCount = playlistAddSongs(ytUrls)
    notify({ text: `${addedCount} video URLs appended!` })
  }

  function handleUpcomingSelected(offset: number) {
    playlistSetIndex(playlistIndex + offset)
  }

  function onVideoInfoError(videoId: string) {
    playlistRemoveSong(videoId)
  }

  function onPlaybackError() {
    if (videoSlice) {
      playlistRemoveSong(videoSlice.videoId)
    }
  }

  function removeCurrentSong() {
    if (videoSlice) {
      playlistRemoveSong(videoSlice.videoId)
    }
  }

  function onSeek(time: number) {
    setCurrentTime(time)
    playerRef.current?.seek(time)
  }

  function onControlPlay() {
    playerRef.current?.play()
  }

  function onControlPause() {
    playerRef.current?.pause()
  }

  function onSetVolume(volume: number) {
    playerRef.current?.setVolume(volume)
    setPlayerVolume(volume)
  }

  function onMute() {
    playerRef.current?.mute()
    setMuted(true)
  }

  function onUnmute() {
    playerRef.current?.unmute()
    setMuted(false)
  }

  function handleSongEnded() {
    if (playlist.length > 1) {
      playlistNext()
    } else {
      // loop a single song
      playerRef.current?.seek(0)
    }
  }

  function handleShowPlaylist() {
    if (showStageRef.current !== stages.PLAYLIST) {
      setShowStage(stages.PLAYLIST)
    } else {
      setShowStage(playlist.length ? stages.PLAYING : stages.INTRO)
    }
  }

  function handleShowHelp() {
    if (showStageRef.current !== stages.HELP) {
      setShowStage(stages.HELP)
    } else {
      setShowStage(playlist.length ? stages.PLAYING : stages.INTRO)
    }
  }

  function handleShowPlaying() {
    if (playlist.length) {
      setShowStage(stages.PLAYING)
    }
  }

  function onPlaylistOrderChange(newPlaylist: Array<{ videoId: string }>) {
    playlistChangeOrder(newPlaylist)
  }

  function onPlaylistShuffle() {
    playlistShuffle()
  }

  function onClearPlaylist() {
    setShowPlaylistRemoveConfirmation(true)
  }

  function onConfirmPlaylistRemove() {
    playlistClear()
    setShowPlaylistRemoveConfirmation(false)
  }

  function onGeneratePlaylistURL() {
    const videoIds = playlist.map((video) => video.videoId)
    createPlaylist(videoIds)
      .then((playlistId: string) => {
        if (playlistId) {
          setPlaylistURL(`${window.location.origin}?p=${playlistId}`)
          setShowPlaylistShareModal(true)
        } else {
          throw new Error('No playlist ID')
        }
      })
      .catch(() => {
        notify({
          text: 'Failed to create playlist URL. Please try again.',
          type: 'error',
        })
      })
  }

  return (
    <div className="appContainer">
      <AppHeader
        onToggleHelp={handleShowHelp}
        onTogglePlaylist={handleShowPlaylist}
        activeStage={showStage}
        hasPlayback={playlist.length > 0}
      />

      <div
        className={`appMain ${showStage === stages.INTRO ? 'stretched' : ''}`}
      >
        {showPlaylistRemoveConfirmation && (
          <ConfirmModal
            onClose={() => setShowPlaylistRemoveConfirmation(false)}
            onConfirm={onConfirmPlaylistRemove}
          >
            <p>
              Please confirm that you want to clear the complete playlist. All
              videos will be removed.
            </p>
          </ConfirmModal>
        )}

        {showPlaylistShareModal && (
          <SharePlaylistModal
            onClose={() => {
              setPlaylistURL('')
              setShowPlaylistShareModal(false)
            }}
          >
            <p>
              Your playlist URL is: <a href={playlistURL}>{playlistURL}</a>
            </p>
          </SharePlaylistModal>
        )}

        <DropArea
          onDropMode={handleDropModeChange}
          onDroppedSongs={handleDroppedSongs}
        />

        {/*
          Player wrapper is needed because YT API gets confused if its container
          starts disappearing or switching places in its parent node.
          This way we always maintain its container in the DOM.
        */}
        <div
          style={{ display: videoSlice ? undefined : 'none' }}
          className={`appPlayerWrap ${disablePlayerPointerEvents ? 'no-pointer-events' : ''}`}
        >
          {videoSlice && (
            <Player
              className={dropMode ? 'no-pointer-events' : ''}
              ref={playerRef}
              videoId={videoSlice.videoId}
              startSeconds={videoSlice.startSeconds}
              endSeconds={videoSlice.endSeconds}
              halfScreen={isPlaylistOpen}
              onEnded={handleSongEnded}
              onPlaying={() => setPlaying(true)}
              onReady={() => {}}
              onPaused={() => setPlaying(false)}
              onDuration={(d) => setDuration(d)}
              onCurrentTime={(t) => setCurrentTime(t)}
              onError={onPlaybackError}
            />
          )}
        </div>

        <div style={{ display: showStage === stages.INTRO ? undefined : 'none' }}>
          <HowTo onAddYtUrls={handleAddVideoIdsThroughInput} />
        </div>
        <div
          style={{
            display: showStage === stages.PLAYLIST ? undefined : 'none',
          }}
        >
          <SongList
            playlist={playlist}
            playlistIndex={playlistIndex}
            onShuffle={onPlaylistShuffle}
            onClearPlaylist={onClearPlaylist}
            onSelectedSongIndex={(i) => playlistSetIndex(i)}
            onVideoInfoError={onVideoInfoError}
            onPlaylistOrderChange={onPlaylistOrderChange}
            onGeneratePlaylistURL={onGeneratePlaylistURL}
            notify={notify}
          />
        </div>
        <div
          style={{
            display: showStage === stages.HELP ? undefined : 'none',
          }}
        >
          <HelpScreen />
        </div>
      </div>

      {videoSlice && (
        <Controls
          onPrevious={playlistPrevious}
          onNext={playlistNext}
          onRemove={removeCurrentSong}
          onSeek={onSeek}
          onPlay={onControlPlay}
          onPause={onControlPause}
          onSetVolume={onSetVolume}
          onMute={onMute}
          onUnmute={onUnmute}
          onStartedMouseTracking={() =>
            setDisablePlayerPointerEvents(true)
          }
          onStoppedMouseTracking={() =>
            setDisablePlayerPointerEvents(false)
          }
          duration={duration}
          currentTime={currentTime}
          playing={playing}
          playerVolume={playerVolume}
          muted={muted}
        />
      )}
    </div>
  )
}
