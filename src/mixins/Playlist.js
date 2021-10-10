const UPCOMING_SONGS_NUMBER = 3;

function generateUpcomingList(playlist, currentIndex) {
  let upcoming = [];

  if (playlist.length === 0) return upcoming;

  let index = currentIndex + 1;

  while (upcoming.length < UPCOMING_SONGS_NUMBER) {
    const remainingSongs = UPCOMING_SONGS_NUMBER - upcoming.length;

    if (index + remainingSongs < playlist.length) {
      const chunk = playlist.slice(index, index + remainingSongs);
      upcoming = upcoming.concat(chunk);
    } else {
      const chunk = playlist.slice(index, playlist.length);
      upcoming = upcoming.concat(chunk);
      index = 0;
    }
  }

  return upcoming;
}

const data = () => ({
  playlistIndex: 0,
  playlist: [],
});

const methods = {
  playlistAddSongs(songUrls = []) {
    const previousPlaylistLength = this.playlist.length;
    const extendedPlaylist = this.playlist.concat(songUrls);
    const extendedPlaylistUnique = this.$utils.list.uniqBy(
      extendedPlaylist,
      (song) => song.videoId
    );
    this.playlist = extendedPlaylistUnique;

    return this.playlist.length - previousPlaylistLength;
  },

  playlistRemoveSong(videoId) {
    const playlistLength = this.playlistGetLength();
    this.$utils.list.remove(this.playlist, (song) => song.videoId === videoId);
    this.playlist = [...this.playlist];

    // if we are removing the last song in the playlist, we need to return to the index 0
    if (this.playlistIndex === playlistLength - 1) {
      this.playlistSetIndex(0);
    }
  },

  playlistClear() {
    this.playlist = [];
    this.playlistIndex = 0;
  },

  playlistRemoveSongs(videoIds = []) {
    this.$utils.list.remove(this.playlist, (song) =>
      videoIds.includes(song.videoId)
    );
    this.playlist = [...this.playlist];
  },

  playlistSetIndex(index = 0) {
    if (!this.playlist.length) return;

    if (index < 0) {
      this.playlistIndex = this.playlist.length + index; // backwards; cyclic access
    } else {
      this.playlistIndex = index % this.playlist.length;
    }
  },

  playlistPrevious() {
    this.playlistSetIndex(this.playlistIndex - 1);
  },

  playlistNext() {
    this.playlistSetIndex(this.playlistIndex + 1);
  },

  playlistShuffle() {
    const currentVideoId = this.playlistGetCurrentVideoId();
    let newIndex = this.playlistIndex;
    this.$utils.list.shuffleList(this.playlist);

    // try to track and keep the already playing song index, but in a non destructive and safe way
    if (currentVideoId) {
      const newCurrentVideoIndex = this.playlist.findIndex(
        (video) => video.videoId === currentVideoId
      );

      if (newCurrentVideoIndex > -1) {
        newIndex = newCurrentVideoIndex;
      }
    }

    this.playlist = [...this.playlist];
    this.playlistIndex = newIndex;
  },

  playlistChangeOrder(newPlaylist) {
    const currentVideoId = this.playlistGetCurrentVideoId();
    let newIndex = this.playlistIndex;

    // try to track and keep the already playing song index, but in a non destructive and safe way
    if (currentVideoId) {
      const newCurrentVideoIndex = newPlaylist.findIndex(
        (video) => video.videoId === currentVideoId
      );

      if (newCurrentVideoIndex > -1) {
        newIndex = newCurrentVideoIndex;
      }
    }

    this.playlist = [...newPlaylist];
    this.playlistIndex = newIndex;
  },

  playlistGetCurrentSong() {
    return this.playlist[this.playlistIndex];
  },

  playlistGetLength() {
    return this.playlist.length;
  },

  playlistGetCurrentVideoId() {
    return this.playlist[this.playlistIndex]?.videoId;
  },
};

const computed = {
  upcomingSongs() {
    return generateUpcomingList(this.playlist, this.playlistIndex);
  },
};

export default {
  data,
  methods,
  computed,
};
