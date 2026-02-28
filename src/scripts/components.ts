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
    AliasCreatorElement: typeof AliasCreatorElement;
    AliasDataElement: typeof AliasDataElement;
    AliasDataImporterElement: typeof AliasDataImporterElement;
    AliasFileImporterElement: typeof AliasFileImporterElement;
    AliasListElement: typeof AliasListElement;
    AliasManagerElement: typeof AliasManagerElement;
  }
  interface HTMLElementTagNameMap {
    [AliasCreatorElement.ELEMENT_NAME]: AliasCreatorElement;
    [AliasDataElement.ELEMENT_NAME]: AliasDataElement;
    [AliasDataImporterElement.ELEMENT_NAME]: AliasDataImporterElement;
    [AliasFileImporterElement.ELEMENT_NAME]: AliasFileImporterElement;
    [AliasListElement.ELEMENT_NAME]: AliasListElement;
    [AliasManagerElement.ELEMENT_NAME]: AliasManagerElement;
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
export { LitAliasPagerElement } from "components/LitAliasPagerElement";
export { LitAliasPagesElement } from "components/LitAliasPagesElement";
