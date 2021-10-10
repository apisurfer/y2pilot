import { getOembed, setOembed } from "./Localstorage";
import config from "@/config/config";

const fetch = ({ url, ...rest }) => window.fetch(url, rest);
const toJSON = (httpResponse) => httpResponse.json();
const fetchJSON = (options) => fetch(options).then(toJSON);

async function fetchOembeds(videoIds = []) {
  const urls = videoIds.map((id) => `https://www.youtube.com/watch?v=${id}`);
  const resultVideos = await fetchJSON({
    url: `${config.workerUrl}/oembeds`,
    method: "POST",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoIds: urls }),
  });

  const videoOembeds = resultVideos.videos.map((video) => {
    return {
      videoId: video.videoId,
      width: video.data.width,
      height: video.data.height,
      title: video.data.title,
      thumbUrl: video.data.thumbnailUrl,
      // thumbWidth: video.data.thumbnailWidth,
      // thumbHeight: video.data.thumbnailHeight,
    };
  });

  // store to LS
  videoOembeds.forEach((video) => {
    setOembed(video.videoId, video);
  });

  return {
    videos: videoOembeds.map((vid) => ({
      videoId: vid.videoId,
      video: vid,
    })),
    failed: resultVideos.failed,
  };
}

async function fetchOembedBatch(videoIds = []) {
  const oembedsFromLS = videoIds
    .map((videoId) => {
      const lsOembedData = getOembed(videoId);

      if (lsOembedData)
        return {
          videoId,
          video: lsOembedData,
        };
    })
    .filter(Boolean);

  const remainingOembedVideoIds = videoIds.filter(
    (id) => !oembedsFromLS.find((oembedData) => oembedData.videoId === id)
  );

  if (remainingOembedVideoIds.length) {
    const fetchedOembeds = await fetchOembeds(remainingOembedVideoIds);

    return {
      videos: oembedsFromLS.concat(fetchedOembeds.videos.filter(Boolean)),
      failed: fetchedOembeds.failed,
    };
  }

  return {
    videos: oembedsFromLS,
    failed: [],
  };
}

async function createPlaylist(videoIds = []) {
  if (!videoIds.length) return;

  const playlistCreation = await fetchJSON({
    url: `${config.workerUrl}/playlists`,
    method: "POST",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ videoIds }),
  });

  return playlistCreation.id;
}

async function fetchPlaylist(playlistId) {
  if (!playlistId) return;

  const playlist = await fetchJSON({
    url: `${config.workerUrl}/playlists/${playlistId}`,
    method: "GET",
    mode: 'cors',
    headers: {
      "Content-Type": "application/json",
    },
  });

  return playlist;
}

export default {
  install(Vue) {
    Vue.prototype.$http = {
      fetchOembedBatch,
      createPlaylist,
      fetchPlaylist,
    };
  },
};
