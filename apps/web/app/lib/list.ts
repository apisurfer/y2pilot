import _uniqBy from 'lodash/uniqBy'

export function shuffleList<T>(list: T[]): T[] {
  return list.sort(() => Math.random() - 0.5)
}

export const uniqBy = _uniqBy
