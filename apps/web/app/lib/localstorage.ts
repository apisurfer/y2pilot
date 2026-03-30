import store from 'store2'

const NAMESPACE = {
  OEMBED: 'oembedInfo',
  PLAYLIST: 'playlist',
}

const PLAYLIST_KEY = {
  SONG_LIST: 'songList',
  INDEX: 'index',
}

const oembedStore = store.namespace(NAMESPACE.OEMBED)
const playlistStore = store.namespace(NAMESPACE.PLAYLIST)

export function getOembed(videoId: string) {
  const oembed = oembedStore.get(videoId)
  if (oembed) return oembed
  return null
}

export function setOembed(videoId: string, oembed: unknown) {
  oembedStore.set(videoId, oembed)
}

export function cleanupOembed() {
  const playlistSongList = playlistStore.get(PLAYLIST_KEY.SONG_LIST)
  const oembedInfo = oembedStore.getAll()

  if (!playlistSongList || !playlistSongList.length) return

  const newOembedInfo = Object.keys(oembedInfo).reduce(
    (oembedInfoAcc: Record<string, unknown>, videoId: string) => {
      if (playlistSongList.includes(videoId)) {
        oembedInfoAcc[videoId] = oembedInfo[videoId]
      }
      return oembedInfoAcc
    },
    {},
  )

  oembedStore.clearAll()
  oembedStore.setAll(newOembedInfo)
}

export function savePlaylist(
  playlistSongs: Array<{ videoId: string }>,
  playlistIndex: number,
) {
  const playlistSongIds = playlistSongs.map((s) => s.videoId)

  playlistStore.setAll({
    [PLAYLIST_KEY.SONG_LIST]: playlistSongIds,
    [PLAYLIST_KEY.INDEX]: playlistIndex,
  })
  setTimeout(() => cleanupOembed(), 500)
}

export function getPlaylist(): {
  songList: string[]
  index: number
} {
  const songList = playlistStore.get(PLAYLIST_KEY.SONG_LIST) ?? []
  const index = playlistStore.get(PLAYLIST_KEY.INDEX) ?? 0

  return { songList, index }
}
