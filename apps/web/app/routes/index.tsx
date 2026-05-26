import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import AppHeader from '~/components/AppHeader/AppHeader'
import Player, { type PlayerHandle } from '~/components/Player/Player'
import DropArea from '~/components/DropArea/DropArea'
import SongList from '~/components/SongList/SongList'
import HowTo from '~/components/HowTo/HowTo'
import HelpScreen from '~/components/HelpScreen/HelpScreen'
import ConfirmModal from '~/components/ConfirmModal/ConfirmModal'
import { useNotify } from '~/components/Notifications'
import { usePlaylist } from '~/hooks/usePlaylist'
import { getYtVideoId, getYtUrls, getSearchParam } from '~/lib/string'
import { fetchPlaylist as fetchPlaylistApi, createPlaylist } from '~/lib/http'

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
  const [showStage, setShowStage] = useState<Stage>(stages.INTRO)
  const [showPlaylistRemoveConfirmation, setShowPlaylistRemoveConfirmation] =
    useState(false)
  // VideoIds of the playlist as last persisted on the backend. null means no
  // backend-backed playlist exists yet for this session. Compared against the
  // current playlist to detect unsaved changes (add/remove/reorder).
  const [backendVideoIds, setBackendVideoIds] = useState<string[] | null>(null)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
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

  useEffect(() => {
    setCurrentVideoSlice()
  }, [playlist, playlistIndex, setCurrentVideoSlice])

  // --- Dirty tracking ---
  // The playlist is "dirty" when the local set/order of videoIds differs from
  // what's been persisted to the backend. While the initial auto-create POST is
  // in flight (backendVideoIds still null with a non-empty playlist), nothing
  // is persisted yet either — treat that as dirty so we warn on unload.
  const currentVideoIds = playlist.map((s) => s.videoId)
  const isPlaylistDirty =
    playlist.length > 0 &&
    (backendVideoIds === null ||
      backendVideoIds.length !== currentVideoIds.length ||
      backendVideoIds.some((id, i) => id !== currentVideoIds[i]))

  // Generation counter: any in-flight POST that resolves after a clear/reset
  // should not retro-actively re-populate backendVideoIds or the URL.
  const persistGenRef = useRef(0)
  const autoCreateInFlightRef = useRef(false)
  const loadingFromUrlRef = useRef(false)

  // --- Mount: Load playlist from URL param ---
  const mountedRef = useRef(false)
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    const urlPlaylistId = getSearchParam(window.location.href, 'p')
    if (!urlPlaylistId) return

    loadingFromUrlRef.current = true
    const gen = persistGenRef.current
    fetchPlaylistApi(urlPlaylistId)
      .then((response: { videoIds: string[] }) => {
        if (gen !== persistGenRef.current) return
        const songlistObjects = response.videoIds.map((vid: string) => ({
          videoId: vid,
        }))
        playlistAddSongs(songlistObjects)
        playlistSetIndex(0)
        setBackendVideoIds(response.videoIds)
      })
      .finally(() => {
        loadingFromUrlRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Auto-create a backend playlist as soon as a video is added ---
  // Fires once when the local playlist first becomes non-empty without a
  // backend-backed playlist. Subsequent edits become "dirty" against the
  // snapshot and require an explicit Save.
  useEffect(() => {
    if (playlist.length === 0) return
    if (backendVideoIds !== null) return
    if (loadingFromUrlRef.current) return
    if (autoCreateInFlightRef.current) return

    autoCreateInFlightRef.current = true
    setIsSavingPlaylist(true)
    const snapshot = playlist.map((s) => s.videoId)
    const gen = persistGenRef.current
    createPlaylist(snapshot)
      .then((playlistId: string | undefined) => {
        if (gen !== persistGenRef.current) return
        if (!playlistId) throw new Error('No playlist ID')
        setBackendVideoIds(snapshot)
        const url = new URL(window.location.href)
        url.searchParams.set('p', playlistId)
        window.history.replaceState(null, '', url.toString())
      })
      .catch(() => {
        notify({
          text: 'Failed to create a shareable playlist. You can try again with Save.',
          type: 'error',
        })
      })
      .finally(() => {
        autoCreateInFlightRef.current = false
        setIsSavingPlaylist(false)
      })
  }, [playlist, backendVideoIds, notify])

  // --- Before unload warning ---
  // Warn whenever local state has unsaved changes against the backend.
  useEffect(() => {
    if (!isPlaylistDirty) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Sure?'
      return 'Sure?'
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isPlaylistDirty])

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

      if (e.key === '?') {
        handleShowHelp()
        return
      }
      if (e.key === 'Escape') {
        handleShowPlaying()
        return
      }

      // Playlist-related shortcuts: only active once there's a playlist.
      if (showStageRef.current === stages.INTRO) return

      if (e.key === 'p' || e.key === 'P') {
        handleShowPlaylist()
        return
      }
      if (e.shiftKey && (e.key === 'S' || e.key === 's')) {
        playlistShuffle()
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
    persistGenRef.current += 1
    playlistClear()
    setBackendVideoIds(null)
    const url = new URL(window.location.href)
    url.searchParams.delete('p')
    window.history.replaceState(null, '', url.toString())
    setShowPlaylistRemoveConfirmation(false)
  }

  function onSavePlaylist() {
    if (!playlist.length || isSavingPlaylist) return
    const snapshot = playlist.map((v) => v.videoId)
    const gen = persistGenRef.current
    setIsSavingPlaylist(true)
    createPlaylist(snapshot)
      .then((playlistId: string | undefined) => {
        if (gen !== persistGenRef.current) return
        if (!playlistId) throw new Error('No playlist ID')
        setBackendVideoIds(snapshot)
        const url = new URL(window.location.href)
        url.searchParams.set('p', playlistId)
        window.history.replaceState(null, '', url.toString())
        notify({ text: 'New playlist saved. Share URL updated.' })
      })
      .catch(() => {
        notify({
          text: 'Failed to save playlist. Please try again.',
          type: 'error',
        })
      })
      .finally(() => {
        setIsSavingPlaylist(false)
      })
  }

  return (
    <div className="appContainer">
      <AppHeader
        onToggleHelp={handleShowHelp}
        onTogglePlaylist={handleShowPlaylist}
        onSavePlaylist={onSavePlaylist}
        onClearPlaylist={onClearPlaylist}
        activeStage={showStage}
        playlistCount={playlist.length}
        isPlaylistDirty={isPlaylistDirty}
        isSavingPlaylist={isSavingPlaylist}
      />

      <div className="appMain">
        {showPlaylistRemoveConfirmation && (
          <ConfirmModal
            onClose={() => setShowPlaylistRemoveConfirmation(false)}
            onConfirm={onConfirmPlaylistRemove}
          >
            <p>
              Please confirm that you want to clear the playlist. All
              videos will be removed.
            </p>
          </ConfirmModal>
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
              onReady={() => {}}
              onError={onPlaybackError}
            />
          )}
        </div>

        <div
          style={{
            display: showStage === stages.INTRO ? undefined : 'none',
            height: '100%',
          }}
        >
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
            onSelectedSongIndex={(i) => playlistSetIndex(i)}
            onVideoInfoError={onVideoInfoError}
            onPlaylistOrderChange={onPlaylistOrderChange}
            onPrevious={playlistPrevious}
            onNext={playlistNext}
            onRemoveSong={playlistRemoveSong}
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

    </div>
  )
}
