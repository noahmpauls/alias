import type { Alias, AliasCreate, AliasDelete, AliasUpdate } from "@alias/alias";
import type { AliasCreatorElement } from "./AliasCreatorElement";
import type { AliasDataElement } from "./AliasDataElement";
import type { AliasListElement } from "./AliasListElement";
import type { AliasManagerElement } from "./AliasManagerElement";
import type { AliasPagerElement } from "./AliasPagerElement";
import type { AliasPagesElement, PageName } from "./AliasPagesElement";
import type { AliasFileImporterElement } from "./AliasFileImporterElement";
import type { AliasDataImporterElement } from "./AliasDataImporterElement";

declare global {
  interface Window {
    AliasCreatorElement: typeof AliasCreatorElement
    AliasDataElement: typeof AliasDataElement
    AliasDataImporterElement: typeof AliasDataImporterElement
    AliasFileImporterElement: typeof AliasFileImporterElement
    AliasListElement: typeof AliasListElement
    AliasManagerElement: typeof AliasManagerElement
    AliasPagerElement: typeof AliasPagerElement
    AliasPagesElement: typeof AliasPagesElement
  }
  interface HTMLElementTagNameMap {
    [AliasCreatorElement.ELEMENT_NAME]: AliasCreatorElement;
    [AliasDataElement.ELEMENT_NAME]: AliasDataElement;
    [AliasDataImporterElement.ELEMENT_NAME]: AliasDataImporterElement;
    [AliasFileImporterElement.ELEMENT_NAME]: AliasFileImporterElement;
    [AliasListElement.ELEMENT_NAME]: AliasListElement;
    [AliasManagerElement.ELEMENT_NAME]: AliasManagerElement;
    [AliasPagerElement.ELEMENT_NAME]: AliasPagerElement;
    [AliasPagesElement.ELEMENT_NAME]: AliasPagesElement;
  }
  interface GlobalEventHandlersEventMap {
    "createalias": CustomEvent<Alias>;
    "updatealias": CustomEvent<Alias>;
    "deletealias": CustomEvent<Alias>;
    "setpage": CustomEvent<PageName>;
    "extractaliasdata": CustomEvent<{ filename: string, aliases: Alias[] }>;
  }
}
