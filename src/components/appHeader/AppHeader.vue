<template>
  <div :class="css.appHeader">
    <a :class="css.logo" href="/">
      <img :src="img.pilot" alt="Pilot" /> y2pilot
    </a>
    <div :class="css.controls">
      <input
        v-model="manualUrlInput"
        autofocus
        :class="css.urlInput"
        type="url"
        placeholder="Paste URL(s)"
        @input.stop="handleManualUrlChange"
        @keyup.stop
        @paste.stop
      />
      <button
        :class="{ [css.activeControlsBtn]: activeStage === 'playlist' }"
        @click="$emit('toggle-playlist')"
      >
        Playlist
      </button>
      <button
        :class="{ [css.activeControlsBtn]: activeStage === 'help' }"
        @click="$emit('toggle-help')"
      >
        <unicon width="28" height="28" name="question-circle" fill="#fff" />
      </button>
    </div>
  </div>
</template>

<script>
import css from "./AppHeader.module.css";
import pilot from "@/assets/pilot.svg";
import { getYtVideoId, getYtUrls } from "@/utils/string";

export default {
  props: {
    activeStage: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      manualUrlInput: "",
      css,
      img: {
        pilot,
      },
    };
  },
  methods: {
    handleManualUrlChange() {
      const ytUrls = getYtUrls(this.manualUrlInput);
      const videoIds = ytUrls.map(getYtVideoId);

      if (videoIds.length) {
        this.$emit("addYtUrls", videoIds);
        this.manualUrlInput = "";
      }
    },
  },
};
</script>
