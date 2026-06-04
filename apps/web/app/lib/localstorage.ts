import store from 'store2'

const oembedStore = store.namespace('oembedInfo')
const ownerStore = store.namespace('owner')

// One stable owner token per browser. It identifies this user as the owner of
// every playlist they create, so they can keep editing them later. Always reuse
// the existing token if one is already stored.
export function getOrCreateOwnerToken(): string {
  const existing = ownerStore.get('token')
  if (existing) return existing
  const token = crypto.randomUUID()
  ownerStore.set('token', token)
  return token
}

export function getOembed(videoId: string) {
  const oembed = oembedStore.get(videoId)
  if (oembed) return oembed
  return null
}

export function setOembed(videoId: string, oembed: unknown) {
  oembedStore.set(videoId, oembed)
}
