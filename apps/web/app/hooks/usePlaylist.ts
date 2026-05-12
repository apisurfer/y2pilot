import { useState, useCallback, useMemo } from 'react'
import { uniqBy, shuffleList } from '~/lib/list'

export interface Song {
  videoId: string
}

const UPCOMING_SONGS_NUMBER = 3

function generateUpcomingList(playlist: Song[], currentIndex: number): Song[] {
  const upcoming: Song[] = []

  if (playlist.length === 0) return upcoming

  let index = currentIndex + 1

  while (upcoming.length < UPCOMING_SONGS_NUMBER) {
    const remainingSongs = UPCOMING_SONGS_NUMBER - upcoming.length

    if (index + remainingSongs < playlist.length) {
      const chunk = playlist.slice(index, index + remainingSongs)
      upcoming.push(...chunk)
    } else {
      const chunk = playlist.slice(index, playlist.length)
      upcoming.push(...chunk)
      index = 0
    }
  }

  return upcoming
}

export function usePlaylist() {
  const [playlist, setPlaylist] = useState<Song[]>([])
  const [playlistIndex, setPlaylistIndex] = useState(0)

  const upcomingSongs = useMemo(
    () => generateUpcomingList(playlist, playlistIndex),
    [playlist, playlistIndex],
  )

  const playlistAddSongs = useCallback(
    (songUrls: Song[] = []) => {
      const existingIds = new Set(playlist.map((s) => s.videoId))
      const newSongs = uniqBy(songUrls, (s) => s.videoId).filter(
        (s) => !existingIds.has(s.videoId),
      )
      setPlaylist((prev) => {
        const prevIds = new Set(prev.map((s) => s.videoId))
        return prev.concat(newSongs.filter((s) => !prevIds.has(s.videoId)))
      })
      return newSongs.length
    },
    [playlist],
  )

  const playlistRemoveSong = useCallback(
    (videoId: string) => {
      const removedIdx = playlist.findIndex((s) => s.videoId === videoId)
      if (removedIdx === -1) return
      setPlaylist((prev) => prev.filter((song) => song.videoId !== videoId))
      if (removedIdx < playlistIndex) {
        setPlaylistIndex(playlistIndex - 1)
      } else if (
        removedIdx === playlistIndex &&
        playlistIndex === playlist.length - 1
      ) {
        setPlaylistIndex(0)
      }
    },
    [playlist, playlistIndex],
  )

  const playlistClear = useCallback(() => {
    setPlaylist([])
    setPlaylistIndex(0)
  }, [])

  const playlistSetIndex = useCallback(
    (index: number = 0) => {
      if (!playlist.length) return
      if (index < 0) {
        setPlaylistIndex(playlist.length + index)
      } else {
        setPlaylistIndex(index % playlist.length)
      }
    },
    [playlist.length],
  )

  const playlistPrevious = useCallback(() => {
    if (!playlist.length) return
    const newIndex = playlistIndex - 1
    setPlaylistIndex(newIndex < 0 ? playlist.length - 1 : newIndex)
  }, [playlist.length, playlistIndex])

  const playlistNext = useCallback(() => {
    if (!playlist.length) return
    setPlaylistIndex((playlistIndex + 1) % playlist.length)
  }, [playlist.length, playlistIndex])

  const playlistShuffle = useCallback(() => {
    if (!playlist.length) return
    const currentVideoId = playlist[playlistIndex]?.videoId
    const shuffled = shuffleList([...playlist])
    const newIdx = currentVideoId
      ? shuffled.findIndex((v) => v.videoId === currentVideoId)
      : -1
    setPlaylist(shuffled)
    if (newIdx > -1) setPlaylistIndex(newIdx)
  }, [playlist, playlistIndex])

  const playlistChangeOrder = useCallback(
    (newPlaylist: Song[]) => {
      const currentVideoId = playlist[playlistIndex]?.videoId
      const newIdx = currentVideoId
        ? newPlaylist.findIndex((v) => v.videoId === currentVideoId)
        : -1
      setPlaylist([...newPlaylist])
      if (newIdx > -1) setPlaylistIndex(newIdx)
    },
    [playlist, playlistIndex],
  )

  const playlistGetCurrentSong = useCallback(() => {
    return playlist[playlistIndex]
  }, [playlist, playlistIndex])

  const playlistGetLength = useCallback(() => {
    return playlist.length
  }, [playlist])

  const playlistGetCurrentVideoId = useCallback(() => {
    return playlist[playlistIndex]?.videoId
  }, [playlist, playlistIndex])

  return {
    playlist,
    playlistIndex,
    upcomingSongs,
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
    playlistGetCurrentVideoId,
  }
}
