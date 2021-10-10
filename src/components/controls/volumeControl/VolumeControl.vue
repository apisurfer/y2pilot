<template>
  <div
    :class="css.control"
    ref="control"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
    @mousedown="onMouseDown"
  >
    <div :class="css.bgOutline" />
    <div :class="css.currentValue" :style="currentValueStyle" />
    <div :class="css.hoverLayer" :style="hoverLayerStyle" />
  </div>
</template>

<script>
import css from "./VolumeControl.module.css";

export default {
  props: {
    playerVolume: {
      type: Number,
      default: 0,
    },
  },

  data() {
    return {
      css,
      hoverPosition: 0,
      hoveringOver: false,
      progressWidth: 0,
    };
  },

  created() {
    this.onMouseMoveTrackAndUpdate = (event) => {
      const mouseViewportX = event.clientX;
      const controlsClientRect = this.$refs.control.getBoundingClientRect();
      const minControlsXPosition = controlsClientRect.left;
      const maxControlsXPosition = controlsClientRect.right;
      const normalizedMouseXPos =
        Math.max(
          Math.min(mouseViewportX, maxControlsXPosition),
          minControlsXPosition
        ) - minControlsXPosition;

      const relativeXPos = normalizedMouseXPos / controlsClientRect.width;
      this.$emit("setVolume", relativeXPos * 100);
    };

    this.onWindowMouseUp = () => {
      window.removeEventListener("mousemove", this.onMouseMoveTrackAndUpdate);
      window.removeEventListener("mouseup", this.onWindowMouseUp);
      this.$emit("stoppedMouseTracking");
    };
  },

  mounted() {
    this.progressWidth = this.getProgressWidth();
  },

  computed: {
    currentValueStyle() {
      return {
        width: `${this.progressWidth}px`,
      };
    },

    hoverLayerStyle() {
      return {
        width: `${this.hoverPosition * 100}%`,
      };
    },
  },

  methods: {
    onMouseMove(event) {
      this.hoveringOver = true;
      this.hoverPosition = this.getMouseEventRelativePosition(
        event,
        this.$refs.control
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

    onMouseDown() {
      const relativePosition = this.getMouseEventRelativePosition(
        event,
        this.$refs.control
      );
      this.$emit("setVolume", relativePosition * 100);
      this.$emit("startedMouseTracking");
      window.addEventListener("mousemove", this.onMouseMoveTrackAndUpdate);
      window.addEventListener("mouseup", this.onWindowMouseUp);
    },

    getProgressWidth() {
      if (!this.$refs.control) return 0;

      return (
        (this.playerVolume / 100) *
        this.$refs.control.getBoundingClientRect().width
      );
    },

    hoverTimingStyle() {
      let relPosition = Math.max(Math.min(this.hoverPosition, 0.92), 0.08);

      return {
        left: `${relPosition * 100}%`,
        visibility: this.hoveringOver ? "visible" : "hidden",
      };
    },
  },

  watch: {
    playerVolume() {
      this.progressWidth = this.getProgressWidth();
    },
  },
};
</script>
