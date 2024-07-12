import type { AliasCreate, AliasDelete, AliasUpdate } from "@alias/alias";
import { AliasManagerElement } from "./AliasManagerElement";
import { AliasCreatorElement } from "./AliasCreatorElement";

declare global {
  interface Window {
    AliasCreatorElement: typeof AliasCreatorElement
    AliasManagerElement: typeof AliasManagerElement
  }
  interface HTMLElementTagNameMap {
    [AliasCreatorElement.ELEMENT_NAME]: AliasCreatorElement;
    [AliasManagerElement.ELEMENT_NAME]: AliasManagerElement;
  }
  interface GlobalEventHandlersEventMap {
    "createalias": CustomEvent<AliasCreate>;
    "updatealias": CustomEvent<AliasUpdate>;
    "deletealias": CustomEvent<AliasDelete>;
  }
}
