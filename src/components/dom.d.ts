import type { Alias, AliasCreate, AliasDelete, AliasUpdate } from "@alias/alias";
import { AliasManagerElement } from "./AliasManagerElement";
import { AliasCreatorElement } from "./AliasCreatorElement";
import type { AliasListElement } from "./AliasListElement";

declare global {
  interface Window {
    AliasCreatorElement: typeof AliasCreatorElement
    AliasListElement: typeof AliasListElement
    AliasManagerElement: typeof AliasManagerElement
  }
  interface HTMLElementTagNameMap {
    [AliasCreatorElement.ELEMENT_NAME]: AliasCreatorElement;
    [AliasListElement.ELEMENT_NAME]: AliasListElement;
    [AliasManagerElement.ELEMENT_NAME]: AliasManagerElement;
  }
  interface GlobalEventHandlersEventMap {
    "createalias": CustomEvent<Alias>;
    "updatealias": CustomEvent<Alias>;
    "deletealias": CustomEvent<Alias>;
  }
}
