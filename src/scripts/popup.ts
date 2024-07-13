import { AliasCreatorElement } from "components/AliasCreatorElement";
import { AliasListElement } from "components/AliasListElement";
import { AliasManagerElement } from "components/AliasManagerElement";

AliasCreatorElement.register();
AliasListElement.register();
AliasManagerElement.register();

const aliasList = document.querySelector("alias-list") as AliasListElement;

document.addEventListener("createalias", event => {
  aliasList.createAlias(event.detail)
});

document.addEventListener("updatealias", event => {
  aliasList.updateAlias(event.detail)
});

document.addEventListener("deletealias", event => {
  aliasList.deleteAlias(event.detail)
});
