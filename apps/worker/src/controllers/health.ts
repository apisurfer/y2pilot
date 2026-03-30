import type {Request as IttyRequest} from 'itty-router'

export function pong(req: IttyRequest): Response {
  return new Response('pong')
}
