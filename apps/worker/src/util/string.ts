const videoIdRegex = /^([a-zA-Z0-9_-]{11})$/;
const urlRegex = /(?:.+?)?(?:\/v\/|watch\/|\?v=|&v=|youtu\.be\/|\/v=|^youtu\.be\/|watch%3Fv%3D)([a-zA-Z0-9_-]{11})+/;

// Parse URL for YT video ID, OR match YT video ID and return it
export function getVideoId(text = ""): string | null {
  const urlMatch = text.match(urlRegex);
  const videoIdFromUrl = urlMatch && urlMatch[1];

  if (videoIdFromUrl) {
    return videoIdFromUrl;
  }

  const videoIdMatch = text.match(videoIdRegex);
  return videoIdMatch && videoIdMatch[0];
}
