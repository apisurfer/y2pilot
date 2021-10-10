<template>
  <div
    :class="css.bar"
    ref="barElement"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @mouseup="onMouseUp"
  >
    <div :class="css.progress" :style="progressStyle()" />
    <div :class="css.hoverLayer" :style="hoverLayerStyle()" />
    <div :class="css.timing">{{ currentTimeString }}</div>
    <div :class="css.hoverTiming" :style="hoverTimingStyle()">
      {{ hoveredTime }}
    </div>
  </div>
</template>

<script>
import css from "./ProgressBar.module.css";

function padWithZero(number, width = 2) {
  number = number + "";
  return number.length >= width
    ? number
    : new Array(width - number.length + 1).join("0") + number;
}

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
  },

  data() {
    return {
      css,
      hoverPosition: 0,
      hoveringOver: false,
    };
  },

  computed: {
    currentTimeString() {
      if (!this.currentTime) return ``;

      const remainingTime = this.duration - this.currentTime;

      let seconds = Math.floor(remainingTime % 60);
      let minutes;
      let hours;

      if (remainingTime <= 60) {
        return `${seconds}s`;
      } else if (remainingTime < 3600) {
        minutes = Math.round((remainingTime - seconds) / 60);
        return `${minutes}m ${seconds}s`;
      } else {
        hours = Math.floor(remainingTime / 3600);
        minutes = Math.round((remainingTime - seconds - hours * 3600) / 60);
        return `${hours}h ${minutes}m ${seconds}s`;
      }
    },

    hoveredTime() {
      const currentTime = this.duration * this.hoverPosition;

      let seconds = Math.floor(currentTime % 60);
      let minutes;
      let hours;

      if (currentTime < 3600) {
        minutes = Math.round((currentTime - seconds) / 60);
        return `${padWithZero(minutes)}:${padWithZero(seconds)}`;
      } else {
        hours = Math.floor(currentTime / 3600);
        minutes = Math.round((currentTime - seconds - hours * 3600) / 60);
        return `${hours}:${padWithZero(minutes)}:${padWithZero(seconds)}`;
      }
    },
  },

  methods: {
    onMouseMove(event) {
      this.hoveringOver = true;
      this.hoverPosition = this.getMouseEventRelativePosition(
        event,
        this.$refs.barElement
      );
    },

    onMouseLeave() {
      this.hoverPosition = 0;
      this.hoveringOver = false;
    },

    getMouseEventRelativePosition(event, element) {
      const bbox = element.getBoundingClientRect();
      let eventPositionOffset = Math.round(
        event.pageX - (window.pageXOffset + bbox.left)
      );
      eventPositionOffset = Math.max(0, eventPositionOffset);
      eventPositionOffset = Math.min(bbox.width, eventPositionOffset);

      return eventPositionOffset / bbox.width;
    },

    onMouseUp(event) {
      const relativePosition = this.getMouseEventRelativePosition(
        event,
        this.$refs.barElement
      );
      this.$emit("seek", relativePosition * this.duration);
    },

    progressWidth() {
      if (!this.$refs.barElement) return 0;

      return (
        (this.currentTime / this.duration) *
        this.$refs.barElement.getBoundingClientRect().width
      );
    },

    progressStyle() {
      return {
        width: `${this.progressWidth()}px`,
      };
    },

    hoverLayerStyle() {
      return {
        width: `${this.hoverPosition * 100}%`,
      };
    },

    hoverTimingStyle() {
      let relPosition = Math.max(Math.min(this.hoverPosition, 0.92), 0.08);

      return {
        left: `${relPosition * 100}%`,
        visibility: this.hoveringOver ? "visible" : "hidden",
      };
    },
  },
};
</script>
