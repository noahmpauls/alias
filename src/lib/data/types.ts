/**
 * Represets a data context that exposes data for reading and writing, and
 * allows data modifications to be saved.
 * 
 * @typeParam T runtime object type
 */
export interface IContext<T> {
  /**
   * Save changes to the context data.
   */
  commit(): Promise<void>;

  /**
   * Get a reference to the context data.
   */
  fetch(): Promise<T>;

  /**
   * Clear all data from the context cache.
   */
  clear(): Promise<void>;
}

export interface IContextSet<T> {
  create(...objects: T[]): void;
  delete(...objects: T[]): void;
  get(filter?: (object: T) => boolean): T[];
}
