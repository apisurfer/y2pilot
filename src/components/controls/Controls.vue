<template>
  <div
    :class="[css.controls, isVolumeMouseTracking ? 'no-pointer-events' : '']"
  >
    <div :class="css.fastNav">
      <ProgressBar
        :duration="duration"
        :currentTime="currentTime"
        @seek="reemitSeek"
      />
    </div>

    <div :class="css.mainControlButtons">
      <div :class="css.firstControlSection">
        <button @click="$emit('previous')">
          <unicon width="35" height="35" name="step-backward" fill="#4a635d" />
        </button>
        <button @click="$emit('next')">
          <unicon width="35" height="35" name="skip-forward" fill="#4a635d" />
        </button>

        <button v-if="playing" @click="$emit('pause')">
          <unicon width="35" height="35" name="pause" fill="#4a635d" />
        </button>
        <button v-else @click="$emit('play')">
          <unicon width="35" height="35" name="play" fill="#4a635d" />
        </button>

        <button v-if="muted" @click="$emit('unmute')">
          <unicon
            width="35"
            height="35"
            name="music-tune-slash"
            fill="#4a635d"
          />
        </button>
        <button v-else @click="$emit('mute')">
          <unicon width="35" height="35" name="music" fill="#4a635d" />
        </button>

        <VolumeControl
          @setVolume="onSetVolume"
          @startedMouseTracking="onVolumeStartedMouseTracking"
          @stoppedMouseTracking="onVolumeStoppedMouseTracking"
          :playerVolume="playerVolume"
        />
      </div>

      <div :class="css.playlistControlSection">
        <button @click="$emit('remove')">
          <unicon width="35" height="35" name="trash" fill="#4a635d" />
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ProgressBar from "./progressBar/ProgressBar";
import VolumeControl from "./volumeControl/VolumeControl";
import css from "./Controls.module.css";

export default {
  props: {
    duration: {
      type: Number,
      default: 0,
    },
    currentTime: {
      type: Number,
      default: 0,
    },
    playing: {
      type: Boolean,
      required: true,
    },
    playerVolume: {
      type: Number,
      default: 0,
    },
    muted: {
      type: Boolean,
      required: true,
    },
  },

  data() {
    return {
      css,
      isVolumeMouseTracking: false,
    };
  },

  components: { ProgressBar, VolumeControl },

  methods: {
    reemitSeek(time) {
      this.$emit("seek", time);
    },

    onSetVolume(event) {
      this.$emit("setVolume", event);
    },

    onVolumeStartedMouseTracking() {
      this.isVolumeMouseTracking = true;
      this.$emit("startedMouseTracking");
    },

    onVolumeStoppedMouseTracking() {
      this.isVolumeMouseTracking = false;
      this.$emit("stoppedMouseTracking");
    },
  },
};
</script>
