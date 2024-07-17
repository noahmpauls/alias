import { AliasCreatorElement } from "components/AliasCreatorElement";
import { AliasDataElement } from "components/AliasDataElement";
import { AliasListElement } from "components/AliasListElement";
import { AliasManagerElement } from "components/AliasManagerElement";
import { AliasPagerElement } from "components/AliasPagerElement";
import { AliasPagesElement } from "components/AliasPagesElement";

AliasCreatorElement.register();
AliasDataElement.register();
AliasListElement.register();
AliasManagerElement.register();
AliasPagerElement.register();
AliasPagesElement.register();

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
