const ytVideoIdRegex = /^([a-zA-Z0-9_-]{11})$/;
const ytUrlRegex = /(?:.+?)?(?:\/v\/|watch\/|\?v=|&v=|youtu\.be\/|\/v=|^youtu\.be\/|watch%3Fv%3D)([a-zA-Z0-9_-]{11})+/;

export function splitByDelimiter(text) {
  const delimiters = /\s+|[,;]/; // split on empty spaces, or single coma/semicolon
  return text.split(delimiters);
}

export function textElipsis(text = "", limitLength) {
  if (text.length <= limitLength) return text;

  const shortenedText = text.substr(0, limitLength);

  return `${shortenedText}...`;
}

export function isYtResourceIdentifier(text) {
  return ytUrlRegex.test(text) || ytVideoIdRegex.test(text);
}

export function getYtVideoId(text = "") {
  const urlMatch = text.match(ytUrlRegex);
  const videoIdFromUrl = urlMatch && urlMatch[1];

  if (videoIdFromUrl) {
    return videoIdFromUrl;
  }

  const videoIdMatch = text.match(ytVideoIdRegex);
  return videoIdMatch && videoIdMatch[0];
}

export function getYtUrls(text) {
  // when c/p multiple bookmark links, they might appear concatenated, without any spacing between urls
  const textSeparatedProtocolFromText = text.replace("https://", " https://");
  // split and clean
  const chunks = splitByDelimiter(textSeparatedProtocolFromText).map((chunk) =>
    chunk.trim()
  );
  // filter yt resource urls
  return chunks.filter((chunk) => isYtResourceIdentifier(chunk));
}

export function getUrlComponents(url) {
  return new window.URL(url);
}

export function getSearchParam(url, paramName) {
  const urlComponents = getUrlComponents(url);
  return urlComponents.searchParams.get(paramName);
}
