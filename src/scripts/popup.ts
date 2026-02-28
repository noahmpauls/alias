import type { LitAliasListElement } from "scripts/components";

const aliasList = document.querySelector(
  "lit-alias-list",
) as LitAliasListElement;

document.addEventListener("createalias", (event) => {
  aliasList.createAlias(event.detail);
});

document.addEventListener("updatealias", (event) => {
  aliasList.updateAlias(event.detail);
});

document.addEventListener("deletealias", (event) => {
  aliasList.deleteAlias(event.detail);
});
