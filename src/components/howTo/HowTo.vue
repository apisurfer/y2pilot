<template>
  <div :class="css.howTo">
    <div :class="css.howToContent">
      <!-- <img src="@/assets/yt.jpg" /> -->
      <div :class="css.pitch">
        <h1>Youtube playlists on the fly</h1>
        <ul>
          <li>no account required</li>
          <li>no interruptions, non-stop play</li>
          <li>create, share, play, forget about it</li>
          <li>incognito mode supported</li>
          <li>free 😎</li>
        </ul>
      </div>
      <div :class="css.initInstructions">
        <p>
          Drag and drop, or paste a Youtube:
          <ul>
            <li>link</li>
            <li>bookmark</li>
            <li>video thumbnail</li>
          </ul>
          Try it out with example links, grab the link and drop it anywhere
          on this page.
        </p>
        <p>
          <a
            :class="css.testLink"
            href="https://www.youtube.com/watch?v=vcsSc2iksC0"
          >
            https://www.youtube.com/watch?v=vcsSc2iksC0
          </a>
        </p>
        <div :class="css.ytCard">
          <a
            :class="css.ytThumb"
            href="https://i.ytimg.com/vi/vcsSc2iksC0/hq720.jpg?sqp=-oaymwEcCOgCEMoBSFXyq4qpAw4IARUAAIhCGAFwAcABBg==&rs=AOn4CLD1W-wiV9udy5UrSMF4K9sG7C9BUw"
          >
          </a>
          <div :class="css.ytInfo">
            <a href="https://www.youtube.com/watch?v=vcsSc2iksC0">
              Life in a Day 2020 | Official Documentary
            </a>
            <img src="@/assets/yt-card-cutout.png" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import css from "./HowTo.module.css";

export default {
  data() {
    return {
      css,
    };
  },
};
</script>
