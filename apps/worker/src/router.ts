import { Router } from 'itty-router'
import * as health from './controllers/health'
import * as oembed from './controllers/oembed'
import * as playlist from './controllers/playlist';
import {corsRespondOk} from './util/response';

const router = Router()

router
  .get('/ping', health.pong)

  .options('*', corsRespondOk)

  .get('/oembeds', oembed.getOembed)
  .post('/oembeds', oembed.getOembedBatch)

  .post('/playlists', playlist.createPlaylist)
  .get('/playlists/:id', playlist.getPlaylist)

  // catch everything else
  .all('*', () => new Response('Not Found.', { status: 404 }))

export { router }
