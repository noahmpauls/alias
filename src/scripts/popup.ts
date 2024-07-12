import type { Alias } from "@alias/alias";
import { RequestType, ResponseType } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { AliasCreatorElement } from "components/AliasCreatorElement";
import { AliasManagerElement } from "components/AliasManagerElement";

AliasCreatorElement.register();
AliasManagerElement.register();

const messenger = BrowserClientMessenger;

const search = document.querySelector("#search") as HTMLInputElement;
const aliasList = document.querySelector("#aliases");

const filterAliases = (filter: string = "") => {
  for (const aliasListing of aliasList?.querySelectorAll("alias-manager") ?? []) {
    const dataAlias = aliasListing.dataset.alias;
    if (dataAlias === undefined) {
      return;
    }
    aliasListing.style.display = dataAlias?.startsWith(filter)
      ? "block"
      : "none";
  }
}

const refreshAliasList = async () => {
  const aliasesResponse = await messenger.send({ type: RequestType.ALIASES_GET });
  if (aliasesResponse.type !== ResponseType.ALIASES_GET) {
    return;
  }
  const aliases = aliasesResponse.data.sort((a, b) => a.code.localeCompare(b.code));
  const newNodes = aliases.map(createAliasListing);
  newNodes.length > 0
    ? aliasList?.replaceChildren(...newNodes)
    : aliasList?.replaceChildren(makeNoAliases());
  filterAliases(search.value);
}

const makeNoAliases = () : HTMLElement => {
  const noAliases = document.getElementById("no-aliases") as HTMLTemplateElement;
  const container = document.createElement("li");
  container.appendChild(noAliases.content.cloneNode(true));
  return container;
}

const createAliasListing = (alias: Alias): HTMLElement => {
  const template = AliasManagerElement.initializeTemplate(alias);
  const listing = document.createElement("alias-manager");
  listing.replaceChildren(template);
  listing.dataset.id = alias.id;
  listing.dataset.alias = alias.code;
  listing.dataset.link = alias.link;
  listing.dataset.note = alias.name;
  const container = document.createElement("li");
  container.appendChild(listing);
  return container;
}

search.addEventListener("input", () => {
  filterAliases(search.value);
})

document.addEventListener("createalias", () => {
  refreshAliasList();
});

document.addEventListener("deletealias", () => {
  refreshAliasList();
});

document.addEventListener("updatealias", () => {
  refreshAliasList();
});

refreshAliasList();
