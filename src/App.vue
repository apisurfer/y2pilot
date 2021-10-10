<template>
  <div class="appContainer">
    <GlobalEvents
      @visibilitychange="onPageVisibilityChange"
      @mousemove="handlePageMouseMove"
      @mouseenter="handlePageMouseEnter"
      @mouseleave="handlePageMouseLeave"
      @mouseout="handlePageMouseOut"
      @dragenter.prevent
      @dragover.prevent
      @drop="handlePageDrop"
      @paste="handleGlobalPasteEvent"
      @keyup.shift.s="onPlaylistShuffle"
      @keyup.left="playlistPrevious"
      @keyup.right="playlistNext"
      @keyup.esc="handleShowPlaying"
      @keyup.49="handleUpcomingSelected(1)"
      @keyup.50="handleUpcomingSelected(2)"
      @keyup.51="handleUpcomingSelected(3)"
      @keyup.80="handleShowPlaylist"
      @keyup.shift.191="handleShowHelp"
    />

    <AppHeader
      @toggle-playlist="handleShowPlaylist"
      @toggle-help="handleShowHelp"
      @addYtUrls="handleAddVideoIdsThroughInput"
      :activeStage="showStage"
    />

    <div :class="['appMain', showStage === stages.INTRO ? 'stretched' : '']">
      <ConfirmModal
        v-if="showPlaylistRemoveConfirmation"
        @close="onCloseClearPlaylistConfirmation"
        @confirm="onConfirmPlaylistRemove"
      >
        <p slot="body">
          Please confirm that you want to clear the complete playlist. All
          videos will be removed.
        </p>
      </ConfirmModal>

      <SharePlaylistModal
        v-if="showPlaylistShareModal"
        @close="onCloseSharePlaylistModal"
      >
        <p slot="body">
          Your playlist URL is: <a :href="playlistURL">{{ playlistURL }}</a>
        </p>
      </SharePlaylistModal>

      <notifications />
      <DropArea
        @dropMode="handleDropModeChange"
        @droppedSongs="handleDroppedSongs"
      />

      <!--
        Player wrapper is needed because YT api gets confused if it's container starts disappearing or switching places in its parent node
        This way we always maintain it's container in the DOM
      -->
      <div
        v-show="videoSlice"
        class="appPlayerWrap"
        :class="{ 'no-pointer-events': disablePlayerPointerEvents }"
      >
        <Player
          v-if="videoSlice"
          :class="{ 'no-pointer-events': dropMode }"
          ref="player"
          :videoId="videoSlice.videoId"
          :startSeconds="videoSlice.startSeconds"
          :endSeconds="videoSlice.endSeconds"
          :halfScreen="isPlaylistOpen"
          @ended="handleSongEnded"
          @playing="handleVideoPlaying"
          @ready="handlePlayerReady"
          @paused="handleVideoPaused"
          @duration="onDuration"
          @currentTime="onCurrentTime"
          @error="onPlaybackError"
        />
      </div>

      <HowTo v-show="showStage === stages.INTRO" />
      <SongList
        v-show="showStage === stages.PLAYLIST"
        :playlist="playlist"
        :playlistIndex="playlistIndex"
        @shuffle="onPlaylistShuffle"
        @clearPlaylist="onClearPlaylist"
        @selectedSongIndex="playlistSetIndex"
        @videoInfoError="onVideoInfoError"
        @playlistOrderChange="onPlaylistOrderChange"
        @generatePlaylistURL="onGeneratePlaylistURL"
      />
      <HelpScreen v-show="showStage === stages.HELP" />
    </div>

    <Controls
      v-if="videoSlice"
      @previous="playlistPrevious"
      @next="playlistNext"
      @remove="removeCurrentSong"
      @seek="onSeek"
      @play="onControlPlay"
      @pause="onControlPause"
      @setVolume="onSetVolume"
      @mute="onMute"
      @unmute="onUnmute"
      @startedMouseTracking="onVolumeStartedMouseTracking"
      @stoppedMouseTracking="onVolumeStoppedMouseTracking"
      :duration="duration"
      :currentTime="currentTime"
      :playing="playing"
      :playerVolume="playerVolume"
      :muted="muted"
    />
  </div>
</template>

<script>
import GlobalEvents from "vue-global-events";
import DropArea from "@/components/dropArea/DropArea";
import Player from "@/components/player/Player";
import Controls from "@/components/controls/Controls";
import PlaylistMixin from "@/mixins/Playlist";
import SongList from "@/components/songList/SongList";
import HowTo from "@/components/howTo/HowTo";
import HelpScreen from "@/components/howTo/HelpScreen";
import AppHeader from "@/components/appHeader/AppHeader";
import ConfirmModal from "@/components/modal/confirmModal/ConfirmModal";
import SharePlaylistModal from "@/components/modal/sharePlaylistModal/SharePlaylistModal";
import { getYtVideoId, getYtUrls } from "@/utils/string";
import "./global.css";

const stages = {
  INTRO: "intro",
  PLAYING: "playing",
  PLAYLIST: "playlist",
  HELP: "help",
};

export default {
  name: "App",

  mixins: [PlaylistMixin],

  components: {
    Player,
    Controls,
    GlobalEvents,
    DropArea,
    SongList,
    HowTo,
    HelpScreen,
    AppHeader,
    ConfirmModal,
    SharePlaylistModal,
  },

  data: function() {
    return {
      videoSlice: null,
      dropMode: false,
      duration: 0,
      currentTime: 0,
      playing: false,
      playerVolume: 0,
      muted: false,
      stages: stages,
      showStage: stages.INTRO,
      showPlaylistRemoveConfirmation: false,
      showPlaylistShareModal: false,
      playlistURL: "",
      disablePlayerPointerEvents: false,
      // manage lost focus on kbd shortcuts window switching. Not detected using visibility change event
      pageLostFocusFnReference: null,
      pageLostFocusTimeout: null,
    };
  },

  created() {
    this.handleWindowUnloadEvent();
    this.pageLostFocusFnReference = () => this.adjustToPageLostFocus();
    this.pageLostFocusFnReference();
  },

  computed: {
    isPlaylistOpen() {
      return this.showStage === stages.PLAYLIST;
    },
  },

  mounted() {
    // Load playlist for playlist ID or fallback to local storage
    const playlistId = this.$utils.string.getSearchParam(
      window.location.href,
      "p"
    );
    if (playlistId) {
      this.loadPlaylistFromPlaylistId(playlistId)
        .then((songlistObjects) => {
          this.playlistAddSongs(songlistObjects);
          this.playlistSetIndex(0);
        })
        .catch(() => {
          this.loadPlaylistFromLocalStorage();
        });
    } else {
      // try to load existing playlist info from localstorage
      this.loadPlaylistFromLocalStorage();
    }

    // keep volume value in sync
    setInterval(() => {
      if (this.$refs.player) {
        this.playerVolume = this.$refs.player.getVolume() ?? 0;
        this.muted = this.$refs.player.isMuted() ?? false;
      }
    }, 500);
  },

  methods: {
    loadPlaylistFromPlaylistId(playlistId) {
      return this.$http.fetchPlaylist(playlistId).then((response) => {
        const {videoIds} = response
        return videoIds.map(id => ({videoId: id}))
      });
    },

    loadPlaylistFromLocalStorage() {
      const { songList, index } = this.$localstorage.getPlaylist();
      const songlistObjects = songList.map((videoId) => ({ videoId }));
      this.playlistAddSongs(songlistObjects);
      this.playlistSetIndex(index);
    },

    playVideoSlice(videoSlice) {
      this.videoSlice = videoSlice;
    },

    handleWindowUnloadEvent() {
      // don't block refresh/close tab in dev environment
      // TODO: use env variables
      if (window.location.href.includes("http://localhost")) {
        return;
      }

      window.addEventListener("beforeunload", this.onBeforeUnload);
    },

    // handles a situation where we switch to another window(browser?) using kbd shortcuts
    // this situation is not detected by handling visibility change since the current tab
    // is still left opened. But when we are returning from another window, we may be dragging links
    // to drop inside of this window. In that case, player events need to be disabled like in the
    // rest of the cases
    adjustToPageLostFocus() {
      if (
        (!document.hasFocus() || document.visibilityState == "hidden") &&
        !this.disablePlayerPointerEvents
      ) {
        this.disablePlayerPointerEvents = true;
      }

      this.pageLostFocusTimeout = setTimeout(() => {
        this.adjustToPageLostFocus();
      }, 500);
    },

    onPageVisibilityChange() {
      // react to tab going out of focus: document.hidden value
      if (document.hidden) {
        this.disablePlayerPointerEvents = true;
      }
    },

    handlePageMouseLeave() {
      // mouse has left the document
      // the same thing is also handled in the handlePageMouseOut handler hack
      // for firefox/safari
      this.disablePlayerPointerEvents = true;
    },
    // firefox/safari mouseleave hack. They don't support the mouseleave event
    // mouseout is used instead, but... it fires on any child leave -_- so we
    // need to detect when the document node has been left
    // TODO: reconsider this event & try to skip this handler for Chrome
    handlePageMouseOut(e) {
      e = e ? e : window.event;
      var from = e.relatedTarget || e.toElement;
      if (!from || from.nodeName == "HTML") {
        // mouse has left the document
        this.disablePlayerPointerEvents = true;
      }
    },
    handlePageMouseEnter(e) {
      if (!this.videoSlice) return;

      const isDragEvent = e instanceof DragEvent;
      if (!isDragEvent) {
        // cancel possible pointer settings
        this.disablePlayerPointerEvents = false;
        return;
      }

      this.disablePlayerPointerEvents = true;
    },
    handlePageMouseMove(e) {
      if (!this.videoSlice) return;

      const isDragEvent = e instanceof DragEvent;
      if (!isDragEvent) {
        // cancel possible pointer settings
        this.disablePlayerPointerEvents = false;
        return;
      }

      this.disablePlayerPointerEvents = true;
    },

    handlePageDrop() {
      this.disablePlayerPointerEvents = false;
    },

    onVolumeStartedMouseTracking() {
      this.disablePlayerPointerEvents = true;
    },

    onVolumeStoppedMouseTracking() {
      this.disablePlayerPointerEvents = false;
    },

    handleDropModeChange(dropMode) {
      this.dropMode = dropMode;
    },

    handleDroppedSongs(ytUrls = []) {
      const addedCount = this.playlistAddSongs(ytUrls);
      this.$notify({
        text: `${addedCount} video URLs appended!`,
      });
    },

    handleAddVideoIdsThroughInput(videoIds = []) {
      const ytUrls = videoIds.map((vId) => ({ videoId: vId }));
      const addedCount = this.playlistAddSongs(ytUrls);
      this.$notify({
        text: `${addedCount} video URLs appended!`,
      });
    },

    handleGlobalPasteEvent(event) {
      const eventText = event?.clipboardData?.getData("text");

      if (!eventText) return;

      const ytUrls = getYtUrls(eventText);
      const videoIds = ytUrls.map(getYtVideoId);
      const ytVideos = videoIds.map((vId) => ({ videoId: vId }));
      const addedCount = this.playlistAddSongs(ytVideos);
      this.$notify({
        text: `${addedCount} video URLs appended!`,
      });
      // restore normal functionality
      this.disablePlayerPointerEvents = false;
    },

    handleUpcomingSelected(offset) {
      this.playlistSetIndex(this.playlistIndex + offset);
    },

    onVideoInfoError(videoId) {
      this.playlistRemoveSong(videoId);
    },

    onPlaybackError() {
      this.removeCurrentSong();
      // this.$notify({
      //   text: `Removed videos that can't be played`,
      //   type: "error",
      // });
    },

    removeCurrentSong() {
      this.playlistRemoveSong(this.videoSlice.videoId);
    },

    onSeek(time) {
      this.currentTime = time;
      this.$refs.player.seek(time);
    },

    onControlPlay() {
      this.$refs.player.play();
    },

    onControlPause() {
      this.$refs.player.pause();
    },

    onSetVolume(volume) {
      this.$refs.player.setVolume(volume);
      this.playerVolume = volume;
    },

    onMute() {
      this.$refs.player.mute();
      this.muted = true;
    },

    onUnmute() {
      this.$refs.player.unmute();
      this.muted = false;
    },

    onCurrentTime(time) {
      this.currentTime = time;
    },

    onDuration(duration) {
      this.duration = duration;
    },

    handleSongEnded() {
      if (this.playlistGetLength() > 1) {
        this.playlistNext();
      } else {
        // hack to loop a single song, when playlist.length === 1
        this.$refs.player.seek(0);
      }
    },

    handleVideoPlaying() {
      this.playing = true;
    },

    handlePlayerReady() {
      // setTimeout(() => {
      //   this.playerVolume = this.$refs.player.getVolume();
      // }, 250);
    },

    handleVideoPaused() {
      this.playing = false;
    },

    setCurrentVideoSlice() {
      // nothing to play
      if (!this.playlistGetLength()) {
        this.videoSlice = null;
        this.showStage = stages.INTRO;
        return;
      }

      // setting first songs for the playlist, move to playing mode
      if (this.showStage === stages.INTRO) {
        this.showStage = stages.PLAYING;
      }

      const currentSong = this.playlistGetCurrentSong();

      this.videoSlice = {
        videoId: currentSong.videoId,
        // startSeconds: currentSong.startSeconds ?? 0,
        startSeconds: 0,
      };
    },

    onBeforeUnload(e) {
      e = e || window.event;

      // For IE and Firefox prior to version 4
      if (e) {
        e.returnValue = "Sure?";
      }

      // For Safari
      return "Sure?";
    },

    handleShowPlaylist() {
      if (this.showStage !== stages.PLAYLIST) {
        this.showStage = stages.PLAYLIST;
      } else {
        if (this.playlistGetLength()) {
          this.showStage = stages.PLAYING;
        } else {
          this.showStage = stages.INTRO;
        }
      }
    },

    handleShowHelp() {
      if (this.showStage !== stages.HELP) {
        this.showStage = stages.HELP;
      } else {
        if (this.playlistGetLength()) {
          this.showStage = stages.PLAYING;
        } else {
          this.showStage = stages.INTRO;
        }
      }
    },

    handleShowPlaying() {
      if (this.playlistGetLength()) {
        this.showStage = stages.PLAYING;
      }
    },

    onPlaylistOrderChange(newPlaylist) {
      this.playlistChangeOrder(newPlaylist);
    },

    onPlaylistShuffle() {
      this.playlistShuffle();
    },

    onClearPlaylist() {
      this.showPlaylistRemoveConfirmation = true;
    },
    onCloseClearPlaylistConfirmation() {
      this.showPlaylistRemoveConfirmation = false;
    },
    onConfirmPlaylistRemove() {
      this.playlistClear();
      this.showPlaylistRemoveConfirmation = false;
    },
    onGeneratePlaylistURL() {
      const videoIds = this.playlist.map((video) => video.videoId);
      this.$http
        .createPlaylist(videoIds)
        .then((playlistId) => {
          if (playlistId) {
            this.playlistURL = `${window.location.origin}?p=${playlistId}`;
            this.showPlaylistShareModal = true;
          } else {
            throw new Error("No playlist ID");
          }
        })
        .catch(() => {
          this.$notify({
            text: `Failed to create playlist URL. Please try again.`,
            type: "error",
          });
        });
    },
    onCloseSharePlaylistModal() {
      this.playlistURL = "";
      this.showPlaylistShareModal = false;
    },
  },

  watch: {
    playlistIndex() {
      this.currentTime = 0; // preemptively set to 0
      this.setCurrentVideoSlice();
      this.$localstorage.savePlaylist(this.playlist, this.playlistIndex);
    },
    playlist() {
      this.setCurrentVideoSlice();
      this.$localstorage.savePlaylist(this.playlist, this.playlistIndex);
    },
  },
};
</script>
