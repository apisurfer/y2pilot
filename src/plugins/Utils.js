import * as list from "../utils/list";
import * as string from "../utils/string";

export default {
  install(Vue) {
    Vue.prototype.$utils = {
      list,
      string,
    };
  },
};
