import type {YtOembedLight} from '../util/fetch'
import type {Env} from '../types'

interface Playlist {
  videoIds: Array<string>
}

export function putVideo(env: Env, id: string, oembed: YtOembedLight) {
  return env.VIDEOS.put(id, JSON.stringify(oembed))
}

export function getVideo(env: Env, id: string): Promise<YtOembedLight | null> {
  return env.VIDEOS.get<YtOembedLight>(id, {type: 'json'})
}

export function putPlaylist(env: Env, playlistId: string, playlist: Playlist) {
  return env.PLAYLISTS.put(playlistId, JSON.stringify(playlist))
}

export function getPlaylist(env: Env, id: string): Promise<Playlist | null> {
  return env.PLAYLISTS.get<Playlist>(id, {type: 'json'})
}
