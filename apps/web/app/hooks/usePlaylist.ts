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
      let addedCount = 0
      setPlaylist((prev) => {
        const extendedPlaylist = prev.concat(songUrls)
        const extendedPlaylistUnique = uniqBy(
          extendedPlaylist,
          (song) => song.videoId,
        )
        addedCount = extendedPlaylistUnique.length - prev.length
        return extendedPlaylistUnique
      })
      return addedCount
    },
    [],
  )

  const playlistRemoveSong = useCallback(
    (videoId: string) => {
      setPlaylist((prev) => {
        const newPlaylist = prev.filter((song) => song.videoId !== videoId)
        const wasLastIndex = playlistIndex === prev.length - 1
        if (wasLastIndex) {
          setPlaylistIndex(0)
        }
        return newPlaylist
      })
    },
    [playlistIndex],
  )

  const playlistClear = useCallback(() => {
    setPlaylist([])
    setPlaylistIndex(0)
  }, [])

  const playlistSetIndex = useCallback(
    (index: number = 0) => {
      setPlaylist((currentPlaylist) => {
        if (!currentPlaylist.length) return currentPlaylist
        if (index < 0) {
          setPlaylistIndex(currentPlaylist.length + index)
        } else {
          setPlaylistIndex(index % currentPlaylist.length)
        }
        return currentPlaylist
      })
    },
    [],
  )

  const playlistPrevious = useCallback(() => {
    setPlaylist((currentPlaylist) => {
      if (!currentPlaylist.length) return currentPlaylist
      setPlaylistIndex((prev) => {
        const newIndex = prev - 1
        return newIndex < 0 ? currentPlaylist.length + newIndex : newIndex
      })
      return currentPlaylist
    })
  }, [])

  const playlistNext = useCallback(() => {
    setPlaylist((currentPlaylist) => {
      if (!currentPlaylist.length) return currentPlaylist
      setPlaylistIndex((prev) => (prev + 1) % currentPlaylist.length)
      return currentPlaylist
    })
  }, [])

  const playlistShuffle = useCallback(() => {
    setPlaylist((prev) => {
      const shuffled = shuffleList([...prev])
      setPlaylistIndex((prevIndex) => {
        const currentVideoId = prev[prevIndex]?.videoId
        if (currentVideoId) {
          const newIdx = shuffled.findIndex(
            (v) => v.videoId === currentVideoId,
          )
          if (newIdx > -1) return newIdx
        }
        return prevIndex
      })
      return shuffled
    })
  }, [])

  const playlistChangeOrder = useCallback((newPlaylist: Song[]) => {
    setPlaylist((prev) => {
      setPlaylistIndex((prevIndex) => {
        const currentVideoId = prev[prevIndex]?.videoId
        if (currentVideoId) {
          const newIdx = newPlaylist.findIndex(
            (v) => v.videoId === currentVideoId,
          )
          if (newIdx > -1) return newIdx
        }
        return prevIndex
      })
      return [...newPlaylist]
    })
  }, [])

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
