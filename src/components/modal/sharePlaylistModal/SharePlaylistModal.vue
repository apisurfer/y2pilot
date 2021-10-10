<template>
  <transition name="modal">
    <div :class="css.modalMask" @click="$emit('close')">
      <div :class="css.modalWrapper">
        <div :class="css.modalContainer" @click.stop>
          <div :class="css.modalHeader">
            <slot name="header">
              <h3>Share or save playlist</h3>
            </slot>
          </div>

          <div :class="css.modalBody">
            <slot name="body"> </slot>
          </div>

          <div :class="css.modalFooter">
            <slot name="footer">
              This URL is a snapshot of your current playlist state and is
              permanent. If you decide to reorder, add, or remove videos from
              your playlist just generate a new playlist URL.
              <button @click="$emit('close')">
                Close
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import css from "./SharePlaylistModal.module.css";

export default {
  data() {
    return {
      css,
    };
  },
  methods: {},
};
</script>
