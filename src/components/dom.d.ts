import type { Alias, AliasCreate, AliasDelete, AliasUpdate } from "@alias/alias";
import { AliasManagerElement } from "./AliasManagerElement";
import { AliasCreatorElement } from "./AliasCreatorElement";
import type { AliasListElement } from "./AliasListElement";
import type { AliasPagesElement, PageName } from "./AliasPagesElement";

declare global {
  interface Window {
    AliasCreatorElement: typeof AliasCreatorElement
    AliasListElement: typeof AliasListElement
    AliasManagerElement: typeof AliasManagerElement
    AliasPagerElement: typeof AliasPagerElement
    AliasPagesElement: typeof AliasPagesElement
  }
  interface HTMLElementTagNameMap {
    [AliasCreatorElement.ELEMENT_NAME]: AliasCreatorElement;
    [AliasListElement.ELEMENT_NAME]: AliasListElement;
    [AliasManagerElement.ELEMENT_NAME]: AliasManagerElement;
    [AliasPagesElement.ELEMENT_NAME]: AliasPagesElement;
  }
  interface GlobalEventHandlersEventMap {
    "createalias": CustomEvent<Alias>;
    "updatealias": CustomEvent<Alias>;
    "deletealias": CustomEvent<Alias>;
    "setpage": CustomEvent<PageName>;
  }
}
