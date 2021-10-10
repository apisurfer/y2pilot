<template>
  <div
    :id="playerElementId"
    :class="[
      css.player,
      { [css.fullScreen]: !halfScreen, [css.halfScreen]: halfScreen },
    ]"
  />
</template>

<script>
import css from "./Player.module.css";
const PLAYER_ELEMENT_ID = "yt-player";
const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  VIDEO_CUED: 5,
};

export default {
  props: {
    videoId: {
      type: String,
      required: true,
    },
    startSeconds: {
      type: Number,
    },
    endSeconds: {
      type: Number,
    },
    halfScreen: {
      type: Boolean,
      default: false,
    },
  },
  data: function() {
    return {
      css,
      player: null,
      playerElementId: PLAYER_ELEMENT_ID,
      progressInterval: undefined,
    };
  },

  created() {
    this.loadSdk();

    const interval = setInterval(() => {
      if (this.checkSdkLoaded()) {
        this.initializePlayer();

        clearInterval(interval);
      } else {
        console.log("player not ready yet");
      }
    }, 250);
  },

  mounted() {
    this.adjustPlayerSize();
  },

  beforeDestroy() {
    if (this.player && this.player.destroy) {
      this.player.destroy();
    }
  },

  methods: {
    loadSdk() {
      const tag = document.createElement("script");
      const firstScriptTag = document.getElementsByTagName("script")[0];
      tag.src = "https://www.youtube.com/iframe_api";
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    },

    checkSdkLoaded() {
      if (!window.YT || !window.YT.Player) {
        return false;
      }

      return true;
    },

    initializePlayer() {
      const playerOptions = {
        events: {
          onReady: this.onReady,
          onError: this.onError,
          onStateChange: this.onStateChange,
          onPlaybackQualityChange: () => {},
          onPlaybackRateChange: () => {},
          onApiChange: () => {},
        },
      };
      this.player = new window.YT.Player(this.playerElementId, playerOptions);
    },

    onReady() {
      this.playCurrentSlice();
      this.$emit("ready");
    },

    onError(error) {
      this.$emit("error", this.videoId);
      console.error(this.videoId, error);
    },

    onEnded() {
      this.$emit("ended");
    },

    onPlaying() {
      this.$emit("playing");
    },

    onPaused() {
      this.$emit("paused");
    },

    onStateChange(event) {
      switch (event.data) {
        case PLAYER_STATE.UNSTARTED:
          break;
        case PLAYER_STATE.ENDED:
          this.onEnded();
          break;
        case PLAYER_STATE.PLAYING:
          this.onPlaying();
          break;
        case PLAYER_STATE.PAUSED:
          this.onPaused();
          break;
        case PLAYER_STATE.BUFFERING:
          break;
        case PLAYER_STATE.VIDEO_CUED:
          break;
        default:
        // unknown player state reported
      }
    },
    play() {
      this.player.playVideo();
    },
    pause() {
      this.player.pauseVideo();
    },
    stop() {
      this.player.stopVideo();
    },
    seek(seconds, allowSeekAhead = true) {
      this.player.seekTo(seconds, allowSeekAhead);
    },
    mute() {
      this.player.mute();
    },
    unmute() {
      this.player.unMute();
    },
    isMuted() {
      return this?.player?.isMuted ? this.player.isMuted() : false;
    },
    // set volume =>  0 - 100
    setVolume(volume) {
      this.player.setVolume(volume);
    },
    getVolume() {
      return this?.player?.getVolume ? this.player.getVolume() : 0;
    },
    getVideoLoadedFraction() {
      return this.player.getVideoLoadedFraction();
    },
    getPlayerState() {
      return this.player.getPlayerState();
    },
    getCurrentTime() {
      return this.player.getCurrentTime();
    },
    getDuration() {
      return this.player.getDuration();
    },
    getVideoUrl() {
      return this.player.getVideoUrl();
    },
    getIframe() {
      return this.player.getIframe();
    },
    destroy() {
      this.player.destroy();
    },
    playSlice(videoSlice) {
      const { videoId, startSeconds = 0, endSeconds } = videoSlice;
      const apiOptions = { videoId, startSeconds };

      if (endSeconds) {
        apiOptions.endSeconds = endSeconds;
      }

      this.player.loadVideoById(apiOptions);
    },

    playCurrentSlice() {
      this.playSlice({
        videoId: this.videoId,
        startSeconds: this.startSeconds,
        endSeconds: this.endSeconds,
      });

      // Force correct second once again!
      // Youtube stores last played timestamps in localstorage or session somewhere
      // and tries to resume the video on that part
      this.seek(this.startSeconds);

      this.progress();
    },

    updateTiming() {
      this.$emit("duration", this.getDuration() ?? 0);
      this.$emit("currentTime", this.getCurrentTime() ?? 0);
    },

    progress() {
      clearInterval(this.progressInterval);
      this.progressInterval = setInterval(this.updateTiming.bind(this), 500);
    },

    adjustPlayerSize() {
      const iframe = document.querySelector(`#${PLAYER_ELEMENT_ID}`);

      // original div is replaced with an iframe so we need to update it's class when this option changes
      if (this.halfScreen) {
        iframe.classList.remove(css.fullScreen);
        iframe.classList.add(css.halfScreen);
      } else {
        iframe.classList.remove(css.halfScreen);
        iframe.classList.add(css.fullScreen);
      }
    },
  },

  watch: {
    videoId() {
      this.playCurrentSlice();
    },
    startSeconds() {
      this.playCurrentSlice();
    },
    halfScreen() {
      this.adjustPlayerSize();
    },
  },
};
</script>
