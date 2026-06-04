import { nanoid } from 'nanoid'
import type {Request as IttyRequest} from 'itty-router'
import {getVideoId} from '../util/string'
import {
  getPlaylist as dbGetPlaylist,
  putPlaylist as dbPutPlaylist,
  updatePlaylistVideos as dbUpdatePlaylistVideos,
} from '../service/d1'
import {getResponseConf} from '../util/response'
import type {Env} from '../types'

interface FixedIttyRequest extends IttyRequest {
  json: () => Promise<Object>
  headers: Headers
}

interface CreatePlaylistRequest {
  videoIds: string[]
  name?: string | null
  emoji?: string | null
}

const OWNER_TOKEN_HEADER = 'X-Owner-Token'

export async function createPlaylist(req: FixedIttyRequest, env: Env): Promise<Response> {
  const {videoIds, name, emoji} = await req.json() as CreatePlaylistRequest || {videoIds:[]}
  const ids = (videoIds || []).map(getVideoId).filter((id): id is string => Boolean(id))

  if (!ids.length) {
    return new Response(JSON.stringify({error:'Bad request - no valid Youtube video ID specified for a playlist'}), getResponseConf(400))
  }

  if (ids.length > 300) {
    return new Response(JSON.stringify({error:'Bad request - too many videos in a playlist. Maximum is 300'}), getResponseConf(400))
  }

  // The creator becomes the owner. NULL token = an unowned, uneditable playlist.
  const ownerToken = req.headers.get(OWNER_TOKEN_HEADER) || null

  const playlistId = nanoid()
  await dbPutPlaylist(env, playlistId, {
    videoIds: ids,
    name: name ?? null,
    emoji: emoji ?? null,
  }, ownerToken)

  return new Response(JSON.stringify({
    id: playlistId
  }), getResponseConf(200))
}

export async function getPlaylist(req: FixedIttyRequest, env: Env): Promise<Response> {
  const id = req.params && req.params.id

  if (!id) {
    return new Response(JSON.stringify({playlistId: id, error: 'Bad playlist ID'}), getResponseConf(400))
  }

  const playlist = await dbGetPlaylist(env, id)

  if (!playlist) {
    return new Response(JSON.stringify({playlistId: id, error: 'Playlist not found.'}), getResponseConf(404))
  }

  // The owner token never leaves the server; the client only learns whether the
  // requester (identified by their header token) is the owner.
  const requestToken = req.headers.get(OWNER_TOKEN_HEADER) || null
  const isOwner = Boolean(playlist.ownerToken) && playlist.ownerToken === requestToken

  return new Response(JSON.stringify({
    id: playlist.id,
    name: playlist.name,
    emoji: playlist.emoji,
    videoIds: playlist.videoIds,
    isOwner,
  }), getResponseConf(200))
}

export async function updatePlaylist(req: FixedIttyRequest, env: Env): Promise<Response> {
  const id = req.params && req.params.id

  if (!id) {
    return new Response(JSON.stringify({playlistId: id, error: 'Bad playlist ID'}), getResponseConf(400))
  }

  const token = req.headers.get(OWNER_TOKEN_HEADER) || null
  if (!token) {
    return new Response(JSON.stringify({error: 'Missing owner token.'}), getResponseConf(403))
  }

  const {videoIds, name, emoji} = await req.json() as CreatePlaylistRequest || {videoIds:[]}
  const ids = (videoIds || []).map(getVideoId).filter((id): id is string => Boolean(id))

  if (!ids.length) {
    return new Response(JSON.stringify({error:'Bad request - no valid Youtube video ID specified for a playlist'}), getResponseConf(400))
  }

  if (ids.length > 300) {
    return new Response(JSON.stringify({error:'Bad request - too many videos in a playlist. Maximum is 300'}), getResponseConf(400))
  }

  const result = await dbUpdatePlaylistVideos(env, id, token, ids, name, emoji)

  if (result === 'not_found') {
    return new Response(JSON.stringify({playlistId: id, error: 'Playlist not found.'}), getResponseConf(404))
  }
  if (result === 'forbidden') {
    return new Response(JSON.stringify({playlistId: id, error: 'You do not own this playlist.'}), getResponseConf(403))
  }

  return new Response(JSON.stringify({id}), getResponseConf(200))
}
