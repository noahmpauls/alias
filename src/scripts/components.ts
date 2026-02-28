import type { Alias } from "@alias/alias";
import { AliasCreatorElement } from "components/AliasCreatorElement";
import { AliasDataElement } from "components/AliasDataElement";
import { AliasDataImporterElement } from "components/AliasDataImporterElement";
import { AliasFileImporterElement } from "components/AliasFileImporterElement";
import { AliasListElement } from "components/AliasListElement";
import { AliasManagerElement } from "components/AliasManagerElement";
import type { PageName } from "components/AliasPagesElement";
import { AliasPagesElement } from "components/AliasPagesElement";

AliasCreatorElement.register();
AliasDataElement.register();
AliasDataImporterElement.register();
AliasFileImporterElement.register();
AliasListElement.register();
AliasManagerElement.register();
AliasPagesElement.register();

declare global {
  interface Window {
    AliasListElement: typeof AliasListElement;
  }
  interface HTMLElementTagNameMap {
    [AliasListElement.ELEMENT_NAME]: AliasListElement;
  }
  interface GlobalEventHandlersEventMap {
    createalias: CustomEvent<Alias>;
    updatealias: CustomEvent<Alias>;
    deletealias: CustomEvent<Alias>;
    setpage: CustomEvent<PageName>;
    extractaliasdata: CustomEvent<{ filename: string; aliases: Alias[] }>;
  }
}

export {
  AliasCreatorElement,
  AliasDataElement,
  AliasDataImporterElement,
  AliasFileImporterElement,
  AliasListElement,
  AliasManagerElement,
  AliasPagesElement,
};
export { LitAliasCreatorElement } from "components/LitAliasCreatorElement";
export { LitAliasDataElement } from "components/LitAliasDataElement";
export { LitAliasDataImporterElement } from "components/LitAliasDataImporterElement";
export { LitAliasFileImporterElement } from "components/LitAliasFileImporterElement";
export { LitAliasManagerElement } from "components/LitAliasManagerElement";
export { LitAliasPagerElement } from "components/LitAliasPagerElement";
export { LitAliasPagesElement } from "components/LitAliasPagesElement";
