import type {Request as IttyRequest} from 'itty-router'
import pLimit from 'p-limit'
import {getVideoId} from '../util/string'
import {fetchOembedInfo} from '../util/fetch'
import {getResponseConf} from '../util/response';

interface FixedIttyRequest extends IttyRequest {
  json: () => Promise<Object>
}

interface BatchRequest {
  videoIds: string[]
}

const limit = pLimit(10)

export async function getOembed(req: FixedIttyRequest): Promise<Response> {
  const ytVideoId = getVideoId(req.query && req.query.videoId)

  if (!ytVideoId) {
    return new Response(JSON.stringify({videoId: ytVideoId, error: 'Bad video ID'}), getResponseConf(400))
  }

  const oembed = await fetchOembedInfo(ytVideoId)

  return new Response(JSON.stringify(oembed), getResponseConf(200))
}

export async function getOembedBatch(req: FixedIttyRequest): Promise<Response> {
  const {videoIds} = await req.json() as BatchRequest || {videoIds:[]}

  if (!videoIds.length) {
    return new Response(JSON.stringify([]), getResponseConf(400))
  }

  if (videoIds.length > 200) {
    return new Response(JSON.stringify({ statusCode: 400, message: "Too many videos. Limit is 200." }), getResponseConf(400))
  }

  const ytVideods = videoIds.map(id => getVideoId(id)).filter(Boolean)
  const requests = ytVideods.map(id => limit(async () => {
    try {
      const data = await fetchOembedInfo(id)
      return {
        videoId: id,
        data
      }
    } catch (error: any) {
      return {
        videoId: id,
        error: error.message
      }
    }
  }))
  const oembeds = await Promise.allSettled(requests)
  const response = {videos: [], failed: []}
  oembeds.forEach(res => {
    if (res.value && res.value.data) {
      response.videos.push(res.value)
    } else if (res.value && res.value.error) {
      response.failed.push(res.value)
    }
  })

  return new Response(JSON.stringify(response), getResponseConf(200));
}
