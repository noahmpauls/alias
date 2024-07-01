import type { IContextSet } from "./types";

export class ArrayContextSet<T> implements IContextSet<T> {
  constructor(
    private readonly array: T[],
  ) { }

  create = (...objects: T[]) => {
    this.array.push(...objects);
  }

  delete = (...objects: T[]) => {
    for (const object of objects) {
      const index = this.array.indexOf(object);
      if (index !== -1) {
        this.array.splice(index, 1);
      }
    }
  }

  get = (filter?: (object: T) => boolean) => {
    return (filter === undefined)
      ? [...this.array]
      : this.array.filter(filter);
  }
}