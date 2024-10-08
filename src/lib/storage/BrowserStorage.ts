import { browser } from "@alias/browser";
import type Browser from "webextension-polyfill";
import type { IStorage } from "./types";

/**
 * Persistent data manipulation through browser local extension storage.
 */
export class BrowserStorage implements IStorage {
  constructor(
    private readonly bucket: Browser.Storage.StorageArea,
  ) { }

  /**
   * @returns browser session storage
   */
  static session = (): BrowserStorage => {
    return new BrowserStorage(browser.storage.session);
  }

  /**
   * @returns browser local storage
   */
  static local = (): BrowserStorage => {
    return new BrowserStorage(browser.storage.local);
  }

  async get<T>(key: string, fallback: T): Promise<T> {
    const getArg = ({ [key]: fallback });
    return await this.bucket.get(getArg)
      .then((data: Record<string, T>) => data[key]);
  }

  async set<T>(key: string, value: T) {
    await this.bucket.set({ [key]: value });
  }

  async delete(key: string) {
    await this.bucket.remove(key);
  }
}

