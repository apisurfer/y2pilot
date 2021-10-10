import Vue from "vue";
import App from "./App.vue";
import NotificationPlugin from "vue-notification";
import Unicon from "vue-unicons";
import {
  uniPlay,
  uniPause,
  uniMusic,
  uniMusicTuneSlash,
  uniSkipForward,
  uniStepBackward,
  uniShuffle,
  uniTrash,
  uniQuestionCircle,
  uniThumbsUp,
  uniDraggabledots,
} from "vue-unicons/src/icons";
import UtilsPlugin from "./plugins/Utils";
import HttpPlugin from "./plugins/Http";
import LocalstoragePlugin from "./plugins/Localstorage";
import store from "./store/store";

Vue.config.productionTip = false;

Vue.use(UtilsPlugin);
Vue.use(HttpPlugin);
Vue.use(LocalstoragePlugin);
Vue.use(NotificationPlugin);

Unicon.add([
  uniPlay,
  uniPause,
  uniMusic,
  uniMusicTuneSlash,
  uniSkipForward,
  uniStepBackward,
  uniShuffle,
  uniTrash,
  uniQuestionCircle,
  uniThumbsUp,
  uniDraggabledots,
]);
Vue.use(Unicon);

new Vue({
  render: (h) => h(App),
  store: store,
}).$mount("#app");
