import type { Alias } from "@alias/alias";
import { SyncedCache } from "@alias/cache";
import { BrowserStorage, type IStorage } from "@alias/storage";
import { ArrayContextSet } from "./ContextSet";
import { seedData } from "./seedData";
import type { IContext, IContextSet } from "./types";

const ALIAS_DATA_KEY = "aliases";
const DEFAULT_ALIASES: Alias[] = ESBUILD_DEV ? seedData() : [];

export class AliasContext implements IContext<IContextSet<Alias>> {
  private readonly cache: SyncedCache<Alias[]>;

  constructor(private readonly storage: IStorage) {
    this.cache = new SyncedCache(async () => {
      const aliases = this.storage.get<Alias[]>(
        ALIAS_DATA_KEY,
        DEFAULT_ALIASES,
      );
      return aliases;
    });
  }

  static browser(): AliasContext {
    return new AliasContext(BrowserStorage.local());
  }

  fetch = async (): Promise<IContextSet<Alias>> => {
    const aliases = await this.cache.value();
    return new ArrayContextSet(aliases);
  };

  commit = async () => {
    const aliases = await this.cache.value();
    this.storage.set(ALIAS_DATA_KEY, aliases);
  };

  clear = async () => {
    await this.cache.clear();
  };
}
