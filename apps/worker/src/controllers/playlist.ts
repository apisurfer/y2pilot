import { nanoid } from 'nanoid'
import type {Request as IttyRequest} from 'itty-router'
import {getVideoId} from '../util/string'
import {getPlaylist as kvGetPlaylist, putPlaylist as kvPutPlaylist} from '../service/kv'
import {getResponseConf} from '../util/response'
import type {Env} from '../types'

interface FixedIttyRequest extends IttyRequest {
  json: () => Promise<Object>
}

interface CreatePlaylistRequest {
  videoIds: string[]
}

export async function createPlaylist(req: FixedIttyRequest, env: Env): Promise<Response> {
  const {videoIds} = await req.json() as CreatePlaylistRequest || {videoIds:[]}
  const ids = videoIds.map(getVideoId)

  if (!ids.length) {
    return new Response(JSON.stringify({error:'Bad request - no valid Youtube video ID specified for a playlist'}), getResponseConf(400))
  }

  if (ids.length > 300) {
    return new Response(JSON.stringify({error:'Bad request - too many videos in a playlist. Maximum is 300'}), getResponseConf(400))
  }

  const playlistId = nanoid()
  await kvPutPlaylist(env, playlistId, {
    videoIds
  })

  return new Response(JSON.stringify({
    id: playlistId
  }), getResponseConf(200))
}

export async function getPlaylist(req: FixedIttyRequest, env: Env): Promise<Response> {
  const id = req.params && req.params.id

  if (!id) {
    return new Response(JSON.stringify({playlistId: id, error: 'Bad playlist ID'}), getResponseConf(400))
  }

  const playlist = await kvGetPlaylist(env, id)

  if (!playlist) {
    return new Response(JSON.stringify({playlistId: id, error: 'Playlist not found.'}), getResponseConf(404))
  }

  return new Response(JSON.stringify(playlist), getResponseConf(200))
}
