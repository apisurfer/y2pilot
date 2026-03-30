const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
}

export const corsRespondOk = () => {
  return new Response("", {status: 204, headers: new Headers(CORS_HEADERS)})
}

export const getResponseConf = (status = 200, customHeaders = {}) => {
  return {
    status,
    headers: new Headers({
      'content-type': 'application/json',
      ...CORS_HEADERS,
      ...customHeaders
    })
  }
}