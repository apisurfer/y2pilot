-- Migration 0001: normalized playlists + videos (migrated from Cloudflare KV)
--
-- Replaces the two KV namespaces:
--   PLAYLISTS  (id -> {videoIds: string[]})        -> playlists + playlist_videos
--   VIDEOS     (videoId -> YtOembedLight oembed)    -> videos
--
-- Apply locally:  pnpm --filter @y2pilot/worker db:migrate:local
-- Apply remotely: pnpm --filter @y2pilot/worker db:migrate:remote

CREATE TABLE videos (
  id               TEXT PRIMARY KEY,           -- 11-char YouTube video id
  title            TEXT,                       -- oembed fields are NULL until fetched/cached
  author_name      TEXT,
  type             TEXT,
  height           INTEGER,
  width            INTEGER,
  thumbnail_height INTEGER,
  thumbnail_width  INTEGER,
  thumbnail_url    TEXT,
  cached_at        INTEGER                     -- unix seconds when oembed was last cached
);

CREATE TABLE playlists (
  id          TEXT PRIMARY KEY,               -- nanoid
  name        TEXT,                           -- optional, user-supplied
  emoji       TEXT,                           -- optional unicode emoji
  owner_token TEXT,                           -- nullable; reserved for the upcoming edit feature
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE playlist_videos (
  playlist_id TEXT    NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id    TEXT    NOT NULL REFERENCES videos(id),
  position    INTEGER NOT NULL,
  PRIMARY KEY (playlist_id, position)
);

CREATE INDEX idx_playlist_videos_playlist ON playlist_videos(playlist_id, position);
