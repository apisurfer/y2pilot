import { getOembed, setOembed, getOrCreateOwnerToken } from './localstorage'
import config from './config'

interface OembedVideo {
  videoId: string
  width: number
  height: number
  title: string
  thumbUrl: string
}

const fetchJSON = (url: string, options?: RequestInit) =>
  window.fetch(url, options).then((r) => r.json())

async function fetchOembeds(videoIds: string[]) {
  const urls = videoIds.map((id) => `https://www.youtube.com/watch?v=${id}`)
  const resultVideos = await fetchJSON(`${config.workerUrl}/oembeds`, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoIds: urls }),
  })

  const videoOembeds: OembedVideo[] = resultVideos.videos.map(
    (video: { videoId: string; data: Record<string, unknown> }) => ({
      videoId: video.videoId,
      width: video.data.width,
      height: video.data.height,
      title: video.data.title,
      thumbUrl: video.data.thumbnailUrl,
    }),
  )

  videoOembeds.forEach((video) => {
    setOembed(video.videoId, video)
  })

  return {
    videos: videoOembeds.map((vid) => ({
      videoId: vid.videoId,
      video: vid,
    })),
    failed: resultVideos.failed,
  }
}

export async function fetchOembedBatch(videoIds: string[]) {
  const oembedsFromLS = videoIds
    .map((videoId) => {
      const lsOembedData = getOembed(videoId)
      if (lsOembedData)
        return {
          videoId,
          video: lsOembedData,
        }
    })
    .filter(Boolean)

  const remainingOembedVideoIds = videoIds.filter(
    (id) =>
      !oembedsFromLS.find(
        (oembedData) => oembedData && oembedData.videoId === id,
      ),
  )

  if (remainingOembedVideoIds.length) {
    const fetchedOembeds = await fetchOembeds(remainingOembedVideoIds)

    return {
      videos: oembedsFromLS
        .filter(Boolean)
        .concat(fetchedOembeds.videos.filter(Boolean)),
      failed: fetchedOembeds.failed,
    }
  }

  return {
    videos: oembedsFromLS.filter(Boolean),
    failed: [],
  }
}

export interface PlaylistMeta {
  name?: string | null
  emoji?: string | null
}

export async function createPlaylist(
  videoIds: string[],
  meta: PlaylistMeta = {},
) {
  if (!videoIds.length) return

  const playlistCreation = await fetchJSON(`${config.workerUrl}/playlists`, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-Token': getOrCreateOwnerToken(),
    },
    body: JSON.stringify({
      videoIds,
      name: meta.name ?? null,
      emoji: meta.emoji ?? null,
    }),
  })

  return playlistCreation.id
}

export interface FetchedPlaylist {
  id: string
  name: string | null
  emoji: string | null
  videoIds: string[]
  isOwner: boolean
}

export async function fetchPlaylist(
  playlistId: string,
): Promise<FetchedPlaylist | undefined> {
  if (!playlistId) return

  const playlist = await fetchJSON(
    `${config.workerUrl}/playlists/${playlistId}`,
    {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        // Sent so the server can tell us whether we own this playlist.
        'X-Owner-Token': getOrCreateOwnerToken(),
      },
    },
  )

  return playlist
}

export type UpdatePlaylistResult = 'ok' | 'forbidden' | 'not_found' | 'error'

// Persist the whole playlist (videos + their order) in a single request. Only
// succeeds when our owner token matches the playlist's owner.
export async function updatePlaylist(
  playlistId: string,
  videoIds: string[],
  meta: PlaylistMeta = {},
): Promise<UpdatePlaylistResult> {
  if (!playlistId) return 'error'

  const res = await window.fetch(`${config.workerUrl}/playlists/${playlistId}`, {
    method: 'PUT',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-Owner-Token': getOrCreateOwnerToken(),
    },
    body: JSON.stringify({
      videoIds,
      name: meta.name ?? null,
      emoji: meta.emoji ?? null,
    }),
  })

  if (res.ok) return 'ok'
  if (res.status === 403) return 'forbidden'
  if (res.status === 404) return 'not_found'
  return 'error'
}
