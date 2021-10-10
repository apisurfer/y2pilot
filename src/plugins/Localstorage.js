import store from "store2";

const NAMESPACE = {
  OEMBED: "oembedInfo",
  PLAYLIST: "playlist",
};

const PLAYLIST_KEY = {
  SONG_LIST: "songList",
  INDEX: "index",
};

const oembedStore = store.namespace(NAMESPACE.OEMBED);
const playlistStore = store.namespace(NAMESPACE.PLAYLIST);

window.oeStore = oembedStore;
window.pStore = playlistStore;

export function getOembed(videoId) {
  const oembed = oembedStore.get(videoId);

  if (oembed) return oembed;

  return null;
}

export function setOembed(videoId, oembed) {
  oembedStore.set(videoId, oembed);
}

// cleanup oembed info that's not linked through saved playlist
export function cleanupOembed() {
  const playlistSongList = playlistStore.get(PLAYLIST_KEY.SONG_LIST);
  const oembedInfo = oembedStore.getAll();

  if (!playlistSongList || !playlistSongList.length) return;

  const newOembedInfo = Object.keys(oembedInfo).reduce(
    (oembedInfoAcc, videoId) => {
      if (playlistSongList.includes(videoId)) {
        oembedInfoAcc[videoId] = oembedInfo[videoId];
      }

      return oembedInfoAcc;
    },
    {}
  );

  // clear all and set new values
  oembedStore.clearAll();
  oembedStore.setAll(newOembedInfo);
}

export function savePlaylist(playlistSongs, playlistIndex) {
  const playlistSongIds = playlistSongs.map((s) => s.videoId);

  playlistStore.setAll({
    [PLAYLIST_KEY.SONG_LIST]: playlistSongIds,
    [PLAYLIST_KEY.INDEX]: playlistIndex,
  });
  // not sure if ls changes happen synchronously, so better be safe. TODO: verify
  setTimeout(() => cleanupOembed(), 500);
}

export function getPlaylist() {
  const songList = playlistStore.get(PLAYLIST_KEY.SONG_LIST) ?? [];
  const index = playlistStore.get(PLAYLIST_KEY.INDEX) ?? 0;

  return {
    songList,
    index,
  };
}

export default {
  install(Vue) {
    Vue.prototype.$localstorage = {
      getOembed,
      setOembed,
      savePlaylist,
      getPlaylist,
    };
  },
};
