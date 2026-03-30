const ytVideoIdRegex = /^([a-zA-Z0-9_-]{11})$/
const ytUrlRegex =
  /(?:.+?)?(?:\/v\/|watch\/|\?v=|&v=|youtu\.be\/|\/v=|^youtu\.be\/|watch%3Fv%3D)([a-zA-Z0-9_-]{11})+/

export function splitByDelimiter(text: string) {
  const delimiters = /\s+|[,;]/
  return text.split(delimiters)
}

export function textElipsis(text = '', limitLength: number) {
  if (text.length <= limitLength) return text

  const shortenedText = text.substr(0, limitLength)

  return `${shortenedText}...`
}

export function isYtResourceIdentifier(text: string) {
  return ytUrlRegex.test(text) || ytVideoIdRegex.test(text)
}

export function getYtVideoId(text = '') {
  const urlMatch = text.match(ytUrlRegex)
  const videoIdFromUrl = urlMatch && urlMatch[1]

  if (videoIdFromUrl) {
    return videoIdFromUrl
  }

  const videoIdMatch = text.match(ytVideoIdRegex)
  return videoIdMatch && videoIdMatch[0]
}

export function getYtUrls(text: string) {
  const textSeparatedProtocolFromText = text.replace('https://', ' https://')
  const chunks = splitByDelimiter(textSeparatedProtocolFromText).map((chunk) =>
    chunk.trim(),
  )
  return chunks.filter((chunk) => isYtResourceIdentifier(chunk))
}

export function getUrlComponents(url: string) {
  return new window.URL(url)
}

export function getSearchParam(url: string, paramName: string) {
  const urlComponents = getUrlComponents(url)
  return urlComponents.searchParams.get(paramName)
}
