import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef, useCallback } from 'react'
import AppHeader from '~/components/AppHeader/AppHeader'
import Player, { type PlayerHandle } from '~/components/Player/Player'
import DropArea from '~/components/DropArea/DropArea'
import SongList from '~/components/SongList/SongList'
import HowTo from '~/components/HowTo/HowTo'
import HelpScreen from '~/components/HelpScreen/HelpScreen'
import { useNotify } from '~/components/Notifications'
import { usePlaylist } from '~/hooks/usePlaylist'
import { getYtVideoId, getYtUrls, getSearchParam } from '~/lib/string'
import {
  fetchPlaylist as fetchPlaylistApi,
  createPlaylist,
  updatePlaylist,
} from '~/lib/http'

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
  // VideoIds of the playlist as last persisted on the backend. null means no
  // backend-backed playlist exists yet for this session. Compared against the
  // current playlist to detect unsaved changes (add/remove/reorder).
  const [backendVideoIds, setBackendVideoIds] = useState<string[] | null>(null)
  // The backend id of the playlist this session is bound to, and whether this
  // browser's owner token owns it. A loaded playlist we don't own is "foreign":
  // read-only, with a "Make a copy" action instead of auto-save.
  const [playlistId, setPlaylistId] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [isSavingPlaylist, setIsSavingPlaylist] = useState(false)
  // Optional playlist title + emoji, and the versions last persisted to the
  // backend (used to detect unsaved meta changes). Empty string = unset.
  const [playlistName, setPlaylistName] = useState('')
  const [playlistEmoji, setPlaylistEmoji] = useState('')
  const [backendName, setBackendName] = useState<string | null>(null)
  const [backendEmoji, setBackendEmoji] = useState<string | null>(null)
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
  const currentVideoIdsKey = currentVideoIds.join(',')
  const isPlaylistDirty =
    playlist.length > 0 &&
    (backendVideoIds === null ||
      backendVideoIds.length !== currentVideoIds.length ||
      backendVideoIds.some((id, i) => id !== currentVideoIds[i]))

  // Normalized current meta ('' → null) and whether it diverges from what's
  // persisted. Only meaningful once a backend playlist exists.
  const currentMeta = {
    name: playlistName.trim() || null,
    emoji: playlistEmoji || null,
  }
  const isMetaDirty =
    backendVideoIds !== null &&
    (currentMeta.name !== backendName || currentMeta.emoji !== backendEmoji)

  // A "foreign" playlist is one we've loaded but don't own. It's read-only;
  // editing requires making a copy first. A freshly-built playlist (no backend
  // id yet) is never foreign — we become its owner on auto-create.
  const isForeign = playlistId !== null && !isOwner
  const isForeignRef = useRef(isForeign)
  isForeignRef.current = isForeign

  // Generation counter: any in-flight POST that resolves after a clear/reset
  // should not retro-actively re-populate backendVideoIds or the URL.
  const persistGenRef = useRef(0)
  const autoCreateInFlightRef = useRef(false)
  const loadingFromUrlRef = useRef(false)

  // Create a backend playlist owned by this browser (token sent by the http
  // layer), bind the session to it, and reflect its id in the URL.
  const createOwnedPlaylist = useCallback(
    (
      snapshot: string[],
      meta: { name: string | null; emoji: string | null },
      gen: number,
    ) => {
      setIsSavingPlaylist(true)
      return createPlaylist(snapshot, meta)
        .then((newId: string | undefined) => {
          if (gen !== persistGenRef.current) return
          if (!newId) throw new Error('No playlist ID')
          setBackendVideoIds(snapshot)
          setBackendName(meta.name)
          setBackendEmoji(meta.emoji)
          setPlaylistId(newId)
          setIsOwner(true)
          const url = new URL(window.location.href)
          url.searchParams.set('p', newId)
          window.history.replaceState(null, '', url.toString())
        })
        .finally(() => {
          setIsSavingPlaylist(false)
        })
    },
    [],
  )

  // Persist the current playlist (videos + order) to an owned backend playlist
  // in one request. Demotes us to non-owner if the server rejects the token.
  const saveOwnedPlaylist = useCallback(
    (
      id: string,
      snapshot: string[],
      meta: { name: string | null; emoji: string | null },
      gen: number,
    ) => {
      setIsSavingPlaylist(true)
      return updatePlaylist(id, snapshot, meta)
        .then((result) => {
          if (gen !== persistGenRef.current) return
          if (result === 'ok') {
            setBackendVideoIds(snapshot)
            setBackendName(meta.name)
            setBackendEmoji(meta.emoji)
          } else if (result === 'forbidden' || result === 'not_found') {
            setIsOwner(false)
            notify({
              text: "You can't edit this playlist. Make a copy to save your changes.",
              type: 'error',
            })
          } else {
            notify({
              text: 'Failed to save playlist changes. Retrying…',
              type: 'error',
            })
          }
        })
        .finally(() => {
          setIsSavingPlaylist(false)
        })
    },
    [notify],
  )

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
      .then((response) => {
        if (gen !== persistGenRef.current) return
        if (!response) return
        const songlistObjects = response.videoIds.map((vid: string) => ({
          videoId: vid,
        }))
        playlistAddSongs(songlistObjects)
        playlistSetIndex(0)
        setBackendVideoIds(response.videoIds)
        setPlaylistId(response.id)
        setIsOwner(response.isOwner)
        setPlaylistName(response.name ?? '')
        setPlaylistEmoji(response.emoji ?? '')
        setBackendName(response.name ?? null)
        setBackendEmoji(response.emoji ?? null)
      })
      .finally(() => {
        loadingFromUrlRef.current = false
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Auto-create a backend playlist as soon as a video is added ---
  // Fires once when the local playlist first becomes non-empty without a
  // backend-backed playlist. We become its owner; subsequent edits are then
  // debounced and auto-saved against it.
  useEffect(() => {
    if (playlist.length === 0) return
    if (backendVideoIds !== null) return
    if (loadingFromUrlRef.current) return
    if (autoCreateInFlightRef.current) return

    autoCreateInFlightRef.current = true
    const snapshot = playlist.map((s) => s.videoId)
    const gen = persistGenRef.current
    createOwnedPlaylist(
      snapshot,
      { name: playlistName.trim() || null, emoji: playlistEmoji || null },
      gen,
    )
      .catch(() => {
        notify({
          text: 'Failed to create a shareable playlist. You can try again with Save.',
          type: 'error',
        })
      })
      .finally(() => {
        autoCreateInFlightRef.current = false
      })
  }, [
    playlist,
    backendVideoIds,
    notify,
    createOwnedPlaylist,
    playlistName,
    playlistEmoji,
  ])

  // --- Auto-save owned playlists ---
  // Once we own a backend playlist, every edit (add/remove/reorder/shuffle) is
  // debounced and persisted in a single PUT. The effect reschedules whenever the
  // videoIds change or a save settles, so edits made during an in-flight save
  // are coalesced into a follow-up save.
  useEffect(() => {
    if (!isOwner || !playlistId) return
    if (!isPlaylistDirty && !isMetaDirty) return
    if (isSavingPlaylist) return

    const snapshot = currentVideoIdsKey ? currentVideoIdsKey.split(',') : []
    const meta = {
      name: playlistName.trim() || null,
      emoji: playlistEmoji || null,
    }
    const gen = persistGenRef.current
    const handle = setTimeout(() => {
      saveOwnedPlaylist(playlistId, snapshot, meta, gen)
    }, 800)
    return () => clearTimeout(handle)
  }, [
    isOwner,
    playlistId,
    isPlaylistDirty,
    isMetaDirty,
    isSavingPlaylist,
    currentVideoIdsKey,
    playlistName,
    playlistEmoji,
    saveOwnedPlaylist,
  ])

  // --- Before unload warning ---
  // Warn whenever local state has unsaved changes against the backend.
  useEffect(() => {
    // Foreign playlists are read-only and never persisted, so don't warn on them.
    if ((!isPlaylistDirty && !isMetaDirty) || isForeign) return

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Sure?'
      return 'Sure?'
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isPlaylistDirty, isMetaDirty, isForeign])

  // --- Document title reflects the playlist's emoji + title ---
  // Format: "<emoji> <title> - y2pilot", with each part optional (just
  // "y2pilot" when neither is set).
  useEffect(() => {
    const prefix = [playlistEmoji.trim(), playlistName.trim()]
      .filter(Boolean)
      .join(' ')
    document.title = prefix ? `${prefix} - y2pilot` : 'y2pilot'
  }, [playlistEmoji, playlistName])

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

      if (isForeignRef.current) {
        notify({
          text: 'This playlist is read-only. Make a copy to edit it.',
          type: 'error',
        })
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
        if (!isForeignRef.current) playlistShuffle()
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

  function notifyReadOnly() {
    notify({
      text: 'This playlist is read-only. Make a copy to edit it.',
      type: 'error',
    })
  }

  function handleDroppedSongs(ytUrls: Array<{ videoId: string }> = []) {
    if (isForeign) return notifyReadOnly()
    const addedCount = playlistAddSongs(ytUrls)
    notify({ text: `${addedCount} video URLs appended!` })
  }

  function handleAddVideoIdsThroughInput(videoIds: string[] = []) {
    if (isForeign) return notifyReadOnly()
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
    if (isForeign) return
    playlistChangeOrder(newPlaylist)
  }

  function onPlaylistShuffle() {
    if (isForeign) return
    playlistShuffle()
  }

  // Force an immediate save of an owned playlist (bypasses the auto-save
  // debounce). Falls back to creating one if it hasn't been created yet.
  function onSavePlaylist() {
    if (!playlist.length || isSavingPlaylist || isForeign) return
    const snapshot = playlist.map((v) => v.videoId)
    const meta = {
      name: playlistName.trim() || null,
      emoji: playlistEmoji || null,
    }
    const gen = persistGenRef.current
    if (playlistId) {
      saveOwnedPlaylist(playlistId, snapshot, meta, gen)
    } else {
      createOwnedPlaylist(snapshot, meta, gen).catch(() => {
        notify({
          text: 'Failed to save playlist. Please try again.',
          type: 'error',
        })
      })
    }
  }

  function onChangeName(newName: string) {
    if (isForeign) return
    setPlaylistName(newName)
  }

  function onChangeEmoji(newEmoji: string) {
    if (isForeign) return
    setPlaylistEmoji(newEmoji)
  }

  // Fork a foreign (read-only) playlist into a fresh one we own, so it becomes
  // editable. The new playlist takes over the URL and the session.
  function onCopyPlaylist() {
    if (!playlist.length || isSavingPlaylist) return
    persistGenRef.current += 1
    const gen = persistGenRef.current
    const snapshot = playlist.map((v) => v.videoId)
    const meta = {
      name: playlistName.trim() || null,
      emoji: playlistEmoji || null,
    }
    createOwnedPlaylist(snapshot, meta, gen)
      .then(() => {
        if (gen !== persistGenRef.current) return
        notify({ text: "Copied! It's now your editable playlist." })
      })
      .catch(() => {
        notify({
          text: 'Failed to copy playlist. Please try again.',
          type: 'error',
        })
      })
  }

  return (
    <div className="appContainer">
      <AppHeader
        onToggleHelp={handleShowHelp}
        onTogglePlaylist={handleShowPlaylist}
        onSavePlaylist={onSavePlaylist}
        onCopyPlaylist={onCopyPlaylist}
        activeStage={showStage}
        playlistCount={playlist.length}
        playlistName={playlistName}
        isOwner={!isForeign}
        isPlaylistDirty={isPlaylistDirty}
        isSavingPlaylist={isSavingPlaylist}
      />

      <div className="appMain">
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
            readOnly={isForeign}
            name={playlistName}
            emoji={playlistEmoji}
            onChangeName={onChangeName}
            onChangeEmoji={onChangeEmoji}
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
