import type { Alias } from "@alias/alias";
import type { PageName } from "components/LitAliasPagesElement";

declare global {
  interface GlobalEventHandlersEventMap {
    createalias: CustomEvent<Alias>;
    updatealias: CustomEvent<Alias>;
    deletealias: CustomEvent<Alias>;
    setpage: CustomEvent<PageName>;
    extractaliasdata: CustomEvent<{ filename: string; aliases: Alias[] }>;
  }
}

export { LitAliasCreatorElement } from "components/LitAliasCreatorElement";
export { LitAliasDataElement } from "components/LitAliasDataElement";
export { LitAliasDataImporterElement } from "components/LitAliasDataImporterElement";
export { LitAliasFileImporterElement } from "components/LitAliasFileImporterElement";
export { LitAliasListElement } from "components/LitAliasListElement";
export { LitAliasManagerElement } from "components/LitAliasManagerElement";
export { LitAliasPagerElement } from "components/LitAliasPagerElement";
export { LitAliasPagesElement } from "components/LitAliasPagesElement";
