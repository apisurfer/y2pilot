import _uniqBy from "lodash/uniqBy";
import _remove from "lodash/remove";

export function shuffleList(list) {
  return list.sort(() => Math.random() - 0.5);
}

export const uniqBy = _uniqBy;
export const remove = _remove;
