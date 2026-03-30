import {getVideo as kvGetVideo, putVideo as kvPutVideo} from '../service/kv'

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

export async function fetchOembedInfo(ytVideoId: string) : Promise<YtOembedLight> {
  if (!ytVideoId) {
    throw new Error('Bad request - no video ID recognised')
  }

  const cachedVal = await kvGetVideo(ytVideoId)

  if (cachedVal) {
    return cachedVal as YtOembedLight
  }

  const ytVideoUrl = `https://www.youtube.com/watch?v=${ytVideoId}`
  const oembed : YtOembed = await fetch(`https://www.youtube.com/oembed/?url=${encodeURIComponent(ytVideoUrl)}`)
    .catch(() => {
      throw new Error("YT - network request failed")
    })
    .then((res) => {
      if (!res.ok) {
        throw new Error("YT - bad response")
      }

      try {
        return res.json()
      } catch {
        throw new Error("YT - JSON parse failed")
      }
    })

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

  await kvPutVideo(ytVideoId, oembedLight)

  return oembedLight
}