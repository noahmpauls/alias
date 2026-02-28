import type { Alias } from "@alias/alias";
import type { PageName } from "components/AliasPagesElement";

declare global {
  interface GlobalEventHandlersEventMap {
    createalias: CustomEvent<Alias>;
    updatealias: CustomEvent<Alias>;
    deletealias: CustomEvent<Alias>;
    setpage: CustomEvent<PageName>;
    extractaliasdata: CustomEvent<{ filename: string; aliases: Alias[] }>;
  }
}

export { AliasCreatorElement } from "components/AliasCreatorElement";
export { AliasDataElement } from "components/AliasDataElement";
export { AliasDataImporterElement } from "components/AliasDataImporterElement";
export { AliasFileImporterElement } from "components/AliasFileImporterElement";
export { AliasListElement } from "components/AliasListElement";
export { AliasManagerElement } from "components/AliasManagerElement";
export { AliasPagerElement } from "components/AliasPagerElement";
export { AliasPagesElement } from "components/AliasPagesElement";
