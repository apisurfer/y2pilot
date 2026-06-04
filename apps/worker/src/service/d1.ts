import type {YtOembedLight} from '../util/fetch'
import type {Env} from '../types'

export interface Playlist {
  id: string
  name: string | null
  emoji: string | null
  ownerToken: string | null
  videoIds: Array<string>
}

interface VideoRow {
  title: string | null
  author_name: string | null
  type: string | null
  height: number | null
  width: number | null
  thumbnail_height: number | null
  thumbnail_width: number | null
  thumbnail_url: string | null
}

// --- Videos (oembed cache) ---

// Returns the cached oembed, or null when the row is absent OR is a metadata-less
// placeholder (a video referenced by a playlist that was never fetched). Either
// way the caller should fetch from YouTube and back-fill via putVideo.
export async function getVideo(env: Env, id: string): Promise<YtOembedLight | null> {
  const row = await env.DB.prepare(
    `SELECT title, author_name, type, height, width,
            thumbnail_height, thumbnail_width, thumbnail_url
     FROM videos WHERE id = ? AND title IS NOT NULL`,
  )
    .bind(id)
    .first<VideoRow>()

  if (!row) return null

  return {
    title: row.title!,
    authorName: row.author_name!,
    type: row.type!,
    height: row.height!,
    width: row.width!,
    thumbnailHeight: row.thumbnail_height!,
    thumbnailWidth: row.thumbnail_width!,
    thumbnailUrl: row.thumbnail_url!,
  }
}

export function putVideo(env: Env, id: string, oembed: YtOembedLight) {
  return env.DB.prepare(
    `INSERT INTO videos
       (id, title, author_name, type, height, width,
        thumbnail_height, thumbnail_width, thumbnail_url, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, unixepoch())
     ON CONFLICT(id) DO UPDATE SET
       title            = excluded.title,
       author_name      = excluded.author_name,
       type             = excluded.type,
       height           = excluded.height,
       width            = excluded.width,
       thumbnail_height = excluded.thumbnail_height,
       thumbnail_width  = excluded.thumbnail_width,
       thumbnail_url    = excluded.thumbnail_url,
       cached_at        = excluded.cached_at`,
  )
    .bind(
      id,
      oembed.title,
      oembed.authorName,
      oembed.type,
      oembed.height,
      oembed.width,
      oembed.thumbnailHeight,
      oembed.thumbnailWidth,
      oembed.thumbnailUrl,
    )
    .run()
}

// --- Playlists ---

export async function getPlaylist(env: Env, id: string): Promise<Playlist | null> {
  const meta = await env.DB.prepare(
    `SELECT id, name, emoji, owner_token FROM playlists WHERE id = ?`,
  )
    .bind(id)
    .first<{
      id: string
      name: string | null
      emoji: string | null
      owner_token: string | null
    }>()

  if (!meta) return null

  const {results} = await env.DB.prepare(
    `SELECT video_id FROM playlist_videos WHERE playlist_id = ? ORDER BY position`,
  )
    .bind(id)
    .all<{video_id: string}>()

  return {
    id: meta.id,
    name: meta.name,
    emoji: meta.emoji,
    ownerToken: meta.owner_token,
    videoIds: results.map((r) => r.video_id),
  }
}

export function putPlaylist(
  env: Env,
  playlistId: string,
  playlist: {videoIds: Array<string>; name?: string | null; emoji?: string | null},
  ownerToken: string | null = null,
) {
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO playlists (id, name, emoji, owner_token) VALUES (?, ?, ?, ?)`,
    ).bind(playlistId, playlist.name ?? null, playlist.emoji ?? null, ownerToken),
  ]

  playlist.videoIds.forEach((videoId, position) => {
    // Ensure a videos row exists so the playlist_videos FK holds. Metadata is
    // back-filled lazily the first time the video's oembed is fetched.
    stmts.push(
      env.DB.prepare(`INSERT OR IGNORE INTO videos (id) VALUES (?)`).bind(videoId),
    )
    stmts.push(
      env.DB.prepare(
        `INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES (?, ?, ?)`,
      ).bind(playlistId, videoId, position),
    )
  })

  // batch() runs as a single implicit transaction.
  return env.DB.batch(stmts)
}

// Replace a playlist's videos (and optionally name/emoji) in a single batched
// write, gated on ownership. Returns:
//   'not_found' — no playlist with this id
//   'forbidden' — playlist has no owner, or the token doesn't match it
//   'ok'        — caller owns it and the replacement was applied
export async function updatePlaylistVideos(
  env: Env,
  playlistId: string,
  token: string | null,
  videoIds: Array<string>,
  name?: string | null,
  emoji?: string | null,
): Promise<'not_found' | 'forbidden' | 'ok'> {
  const row = await env.DB.prepare(
    `SELECT owner_token FROM playlists WHERE id = ?`,
  )
    .bind(playlistId)
    .first<{owner_token: string | null}>()

  if (!row) return 'not_found'
  // A NULL owner means nobody owns it — never editable. Plaintext compare.
  if (!row.owner_token || !token || row.owner_token !== token) return 'forbidden'

  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(`DELETE FROM playlist_videos WHERE playlist_id = ?`).bind(
      playlistId,
    ),
  ]

  if (name !== undefined || emoji !== undefined) {
    stmts.push(
      env.DB.prepare(
        `UPDATE playlists SET name = ?, emoji = ? WHERE id = ?`,
      ).bind(name ?? null, emoji ?? null, playlistId),
    )
  }

  videoIds.forEach((videoId, position) => {
    stmts.push(
      env.DB.prepare(`INSERT OR IGNORE INTO videos (id) VALUES (?)`).bind(videoId),
    )
    stmts.push(
      env.DB.prepare(
        `INSERT INTO playlist_videos (playlist_id, video_id, position) VALUES (?, ?, ?)`,
      ).bind(playlistId, videoId, position),
    )
  })

  // batch() runs as a single implicit transaction.
  await env.DB.batch(stmts)
  return 'ok'
}
