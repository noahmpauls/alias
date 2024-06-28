import type { Alias } from "@alias/alias";
import type { IStorage } from "@alias/storage";

const ALIAS_DATA_KEY = "aliases"

export class AliasData {
  constructor(
    private readonly storage: IStorage
  ) { }

  get = async (): Promise<Alias[]> => {
    return await this.storage.get<Alias[]>(ALIAS_DATA_KEY, []);
  }

  set = async (aliases: Alias[]): Promise<void> => {
    await this.storage.set(ALIAS_DATA_KEY, aliases);
  }
}
