<template>
  <div>
    <GlobalEvents @dragenter="onDragEnter" />
    <div
      :class="[css.dropArea, { [css.show]: dropMode }]"
      @drop.prevent="onDrop"
      @dragenter.prevent="onDragEnter"
      @dragleave.prevent="onDragLeave"
      @dragover.prevent="onDragOver"
    >
      <div :class="css.message">
        <unicon width="160" height="160" name="thumbs-up" fill="#000" />
        <span>Drop it like it's </span>
        <span :class="css.oversize">HOT!</span>
      </div>
    </div>
  </div>
</template>

<script>
import GlobalEvents from "vue-global-events";
import css from "./DropArea.module.css";
const EVENTS = {
  DROPPED_SONGS: "droppedSongs",
  DROP_MODE: "dropMode",
};

export default {
  props: {},
  data: function() {
    return {
      dropMode: false,
      css,
    };
  },
  components: {
    GlobalEvents,
  },
  methods: {
    onDragEnter() {
      this.dropMode = true;
    },
    onDragOver() {
      this.dropMode = true;
    },
    onDragLeave() {
      this.dropMode = false;
    },
    onDrop(event) {
      this.dropMode = false;

      if (!event || !event.dataTransfer) return;

      const eventText = event.dataTransfer.getData("text/plain");
      let ytUrls = this.$utils.string.getYtUrls(eventText);

      if (ytUrls.length) {
        this.handleDroppedUrls(ytUrls);
        return;
      }
      // try another approach... collect links from event html; things that were dropped; img/a tags
      const eventHtml = event.dataTransfer.getData("text/html");
      const mockEl = document.createElement("div");
      mockEl.innerHTML = eventHtml;
      const urls = [];

      mockEl
        .querySelectorAll("img")
        .forEach((i) => urls.push(i.getAttribute("src")));
      mockEl
        .querySelectorAll("a")
        .forEach((a) => urls.push(a.getAttribute("href")));

      ytUrls = urls
        .map((url) => {
          const match = url?.match(
            /^https:\/\/i.ytimg.com\/[a-zA-Z0-9_]+\/([A-Za-z0-9_-]{11})/
          );
          return match && match[1];
        })
        .filter(Boolean)
        .map((vId) => `https://www.youtube.com/watch?v=${vId}`);

      if (ytUrls.length) {
        this.handleDroppedUrls(ytUrls);
      }
    },

    handleDroppedUrls(urls = []) {
      const songList = urls.map((url) => {
        const videoId = this.$utils.string.getYtVideoId(url);
        return { videoId };
      });
      this.$emit(EVENTS.DROPPED_SONGS, songList);
    },
  },
  watch: {
    dropMode(value) {
      this.$emit(EVENTS.DROP_MODE, value);
    },
  },
};
</script>
