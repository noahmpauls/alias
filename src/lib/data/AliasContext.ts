import type { Alias } from "@alias/alias";
import { BrowserStorage, type IStorage } from "@alias/storage";
import type { IContext, IContextSet } from "./types";
import { SyncedCache } from "@alias/cache";
import { ArrayContextSet } from "./ContextSet";
import { EXAMPLE_ALIASES } from "./sampleData";

const ALIAS_DATA_KEY = "aliases"

export class AliasContext implements IContext<IContextSet<Alias>> {
  private readonly cache: SyncedCache<Alias[]>;

  constructor(
    private readonly storage: IStorage
  ) {
    this.cache = new SyncedCache(async () => {
      // TODO: remove example aliases
      const aliases = this.storage.get<Alias[]>(ALIAS_DATA_KEY, EXAMPLE_ALIASES);
      return aliases;
    });
  }

  static browser(): AliasContext {
    return new AliasContext(BrowserStorage.local());
  }

  fetch = async (): Promise<IContextSet<Alias>> => {
    const aliases = await this.cache.value();
    return new ArrayContextSet(aliases);
  }

  commit = async () => {
    const aliases = await this.cache.value();
    this.storage.set(ALIAS_DATA_KEY, aliases);
  }

  clear = async () => {
    await this.cache.clear();
  }
}
