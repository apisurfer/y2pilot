import {nanoid} from 'nanoid';
import type {YtOembedLight} from '../util/fetch'

interface Playlist {
  videoIds: Array<string>
}

interface GetOps {
  type?: "text" | "json" | "arrayBuffer" | "stream"
  cacheTtl?: number
}

interface PutOpts {
  expiration: number
  expirationTtl: number
}

interface KV {
  get: (key: string, opts?: GetOps) => Promise<string | Object>
  put: (key: string, value: Object, opts?: PutOpts) => Promise<any>
}

declare const VIDEOS: KV
declare const PLAYLISTS: KV

export function putVideo(id: string, oembed: YtOembedLight) {
  return VIDEOS.put(id, JSON.stringify(oembed))
}

export function getVideo(id: string) {
  return VIDEOS.get(id, {type: 'json'})
}

export function putPlaylist(playlistId: string, playlist: Playlist) {
  return PLAYLISTS.put(playlistId, JSON.stringify(playlist))
}

export function getPlaylist(id: string) {
  return PLAYLISTS.get(id, {type: 'json'})
}
