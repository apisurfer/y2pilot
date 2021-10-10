<template>
  <transition name="modal">
    <div :class="css.modalMask" @click="$emit('close')">
      <div :class="css.modalWrapper">
        <div :class="css.modalContainer" @click.stop>
          <div :class="css.modalHeader">
            <slot name="header">
              <h3>Confirm your action</h3>
            </slot>
          </div>

          <div :class="css.modalBody">
            <slot name="body">
              Please confirm your action
            </slot>
          </div>

          <div :class="css.modalFooter">
            <slot name="footer">
              <button :class="css.modalButtonLeft" @click="$emit('close')">
                Close
              </button>
              <button :class="css.modalButtonRight" @click="$emit('confirm')">
                Confirm
              </button>
            </slot>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import css from "./ConfirmModal.module.css";

export default {
  data() {
    return {
      css,
    };
  },
  methods: {},
};
</script>
