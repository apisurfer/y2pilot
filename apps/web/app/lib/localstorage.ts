import store from 'store2'

const oembedStore = store.namespace('oembedInfo')

export function getOembed(videoId: string) {
  const oembed = oembedStore.get(videoId)
  if (oembed) return oembed
  return null
}

export function setOembed(videoId: string, oembed: unknown) {
  oembedStore.set(videoId, oembed)
}
