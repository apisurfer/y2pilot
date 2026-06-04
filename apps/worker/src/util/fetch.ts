import {getVideo as dbGetVideo, putVideo as dbPutVideo} from '../service/d1'
import type {Env} from '../types'

interface YtOembed {
  title: string,
  author_name: string,
  author_url: string,
  type: string,
  height: number,
  width: number,
  version: string,
  provider_name: string,
  provider_url: string,
  thumbnail_height: number,
  thumbnail_width: number,
  thumbnail_url: string,
  html: string,
}

export interface YtOembedLight {
  title: string,
  authorName: string,
  type: string,
  height: number,
  width: number,
  thumbnailHeight: number,
  thumbnailWidth: number,
  thumbnailUrl: string,
}

async function fetchOembed(ytVideoId: string, retries = 2): Promise<YtOembed> {
  const ytVideoUrl = `https://www.youtube.com/watch?v=${ytVideoId}`
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(ytVideoUrl)}`

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(oembedUrl)

      if (!res.ok) {
        // 429/5xx are transient - retry; 4xx (private/deleted video) are not
        if ((res.status === 429 || res.status >= 500) && attempt < retries) {
          await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
          continue
        }
        throw new Error(`YT - bad response (${res.status})`)
      }

      try {
        return await res.json()
      } catch {
        throw new Error("YT - JSON parse failed")
      }
    } catch (err: any) {
      // fetch() itself rejected (connection reset / network lost) - retryable
      const isNetworkError = !err?.message?.startsWith('YT -')
      if (isNetworkError && attempt < retries) {
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)))
        continue
      }
      throw isNetworkError ? new Error(`YT - network request failed: ${err?.message ?? err}`) : err
    }
  }

  throw new Error("YT - network request failed: retries exhausted")
}

export async function fetchOembedInfo(env: Env, ytVideoId: string) : Promise<YtOembedLight> {
  if (!ytVideoId) {
    throw new Error('Bad request - no video ID recognised')
  }

  const cachedVal = await dbGetVideo(env, ytVideoId)

  if (cachedVal) {
    return cachedVal
  }

  const oembed = await fetchOembed(ytVideoId)

  const oembedLight = {
    title: oembed.title,
    authorName: oembed.author_name,
    type: oembed.type,
    height: oembed.height,
    width: oembed.width,
    thumbnailHeight: oembed.thumbnail_height,
    thumbnailWidth: oembed.thumbnail_width,
    thumbnailUrl: oembed.thumbnail_url,
  }

  await dbPutVideo(env, ytVideoId, oembedLight)

  return oembedLight
}