import type { Alias, AliasCreate } from "@alias/alias";
import { browser } from "@alias/browser";
import { ClientMessageType, ControllerMessageType } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";

const messenger = BrowserClientMessenger;

messenger.addReceiver(message => {
  console.log(message);
  switch (message.type) {
    case ControllerMessageType.ALIASES_GET: {
      refreshAliasList(message.aliases.sort((a, b) => a.code.localeCompare(b.code)));
      break;
    }
  }
});

messenger.send({ type: ClientMessageType.ALIASES_GET, });

const currentPageButton = document.querySelector("#current-page") as HTMLButtonElement;
const newAliasLinkInput = document.querySelector("#new-alias-link") as HTMLInputElement;

currentPageButton.addEventListener("click", () => {
  browser.tabs.query({ currentWindow: true, active: true })
    .then(tabs => {
      newAliasLinkInput.value = tabs[0].url ?? "";
    });
})

const newAliasForm = document.querySelector("#new-alias") as HTMLFormElement;
newAliasForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(newAliasForm);
  const newAlias: AliasCreate = {
    code: data.get("code")?.toString() ?? "",
    link: data.get("link")?.toString() ?? "",
    name: data.get("name")?.toString() ?? "",
  }
  messenger.send({
    type: ClientMessageType.ALIAS_CREATE,
    alias: newAlias,
  });
});


const aliasList = document.querySelector("#aliases");
aliasList?.addEventListener("delete", async event => {
  const deleteId = (event as unknown as CustomEvent).detail;
  messenger.send({
    type: ClientMessageType.ALIAS_DELETE,
    alias: { id: deleteId },
  });
});

const search = document.querySelector("#search") as HTMLInputElement;

const refreshAliasList = (aliases: Alias[]) => {
  const newNodes = aliases.map(makeAliasEntry);
  newNodes.length > 0
    ? aliasList?.replaceChildren(...newNodes)
    : aliasList?.replaceChildren(makeNoAliases());
  filterAliases(search.value);
}

search.addEventListener("input", () => {
  filterAliases(search.value);
})

const filterAliases = (filter: string = "") => {
  for (const aliasChild of aliasList?.children ?? []) {
    const aliasElement = aliasChild as HTMLElement;
    const dataAlias = aliasElement.dataset.alias;
    if (dataAlias === undefined) {
      return;
    }
    aliasElement.style.display = dataAlias?.startsWith(filter)
      ? "block"
      : "none";
  }
}

const makeNoAliases = () : HTMLElement => {
  const text = document.createElement("i");
  text.innerText = "You don't have any aliases yet. Try creating one!";
  const container = document.createElement("li");
  container.appendChild(text);
  return container;
}

const makeAliasEntry = (alias: Alias): HTMLElement => {
  const nameInput = document.createElement("input");
  nameInput.id = `name-${alias.id}`;
  nameInput.type = "text";
  nameInput.value = alias.name;
  nameInput.ariaLabel = "Name";

  const title = document.createElement("h2");
  title.appendChild(nameInput);

  const searchInput = document.createElement("input");
  searchInput.id = "search"
  searchInput.type = "text";

  const searchLabel = document.createElement("label");
  searchLabel.htmlFor = "searc";
  searchLabel.innerText = "Search: ";

  const searchClearButton = document.createElement("button");
  searchClearButton.innerText = "Clear";

  const search = document.createElement("div");
  search.appendChild(searchLabel);
  search.appendChild(searchInput);
  search.appendChild(searchClearButton);

  const codeInput = document.createElement("input");
  codeInput.id = `alias-${alias.id}`;
  codeInput.type = "text";
  codeInput.value = alias.code;

  const codeLabel = document.createElement("label");
  codeLabel.htmlFor = `alias-${alias.code.replace(" ", "-")}`;
  codeLabel.innerText = "Alias:";

  const code = document.createElement("div");
  code.appendChild(codeLabel);
  code.appendChild(codeInput);

  const linkInput = document.createElement("input");
  linkInput.id = `link-${alias.id}`;
  linkInput.type = "text";
  linkInput.value = alias.link;

  const linkLabel = document.createElement("label");
  linkLabel.htmlFor = `link-${alias.code.replace(" ", "-")}`;
  linkLabel.innerText = "Link:";

  const link = document.createElement("div");
  link.appendChild(linkLabel);
  link.appendChild(linkInput);

  const inputs = document.createElement("div");
  inputs.classList.add("input-container");
  inputs.appendChild(code);
  inputs.appendChild(link);

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
  deleteButton.classList.add("delete");
  deleteButton.addEventListener("click", () => deleteButton.dispatchEvent(new CustomEvent("delete", { detail: alias.id, bubbles: true })));

  const header = document.createElement("header");
  header.appendChild(title);
  header.appendChild(deleteButton);

  const footer = document.createElement("footer");

  const container = document.createElement("li");
  container.classList.add("alias");
  container.appendChild(header);
  container.appendChild(inputs);
  container.appendChild(footer);
  container.dataset.alias = alias.code;
  return container;
}