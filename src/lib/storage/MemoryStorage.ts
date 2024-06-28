import type { IStorage } from "./types";

/**
 * Represents in-memory storage. Useful for testing.
 */
export class MemoryStorage implements IStorage {
  private readonly storage: Map<string, any> = new Map();

  clear = async () => {
    for (const key of this.storage.keys()) {
      await this.delete(key);
    }
  }

  async get<TValue>(key: string, fallback: TValue): Promise<TValue> {
    return Promise.resolve((this.storage.get(key) as TValue) ?? fallback);
  }

  async set<TValue>(key: string, value: TValue): Promise<void> {
    this.storage.set(key, value);
    return Promise.resolve();
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key);
    return Promise.resolve();
  }
}
