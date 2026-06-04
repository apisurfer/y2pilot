import type {YtOembedLight} from '../util/fetch'
import type {Env} from '../types'

export interface Playlist {
  id: string
  name: string | null
  emoji: string | null
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
    `SELECT id, name, emoji FROM playlists WHERE id = ?`,
  )
    .bind(id)
    .first<{id: string; name: string | null; emoji: string | null}>()

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
    videoIds: results.map((r) => r.video_id),
  }
}

export function putPlaylist(
  env: Env,
  playlistId: string,
  playlist: {videoIds: Array<string>; name?: string | null; emoji?: string | null},
) {
  const stmts: D1PreparedStatement[] = [
    env.DB.prepare(
      `INSERT INTO playlists (id, name, emoji) VALUES (?, ?, ?)`,
    ).bind(playlistId, playlist.name ?? null, playlist.emoji ?? null),
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
