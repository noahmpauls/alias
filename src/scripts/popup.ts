import type { Alias, AliasCreate, AliasUpdate } from "@alias/alias";
import { browser } from "@alias/browser";
import { RequestType, ResponseType } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";

const messenger = BrowserClientMessenger;

const createAliasCodeInput = document.querySelector("#create-alias-code") as HTMLInputElement;
const createAliasLinkInput = document.querySelector("#create-alias-link") as HTMLInputElement;
const currentPageButton = document.querySelector("#current-page") as HTMLButtonElement;
const createAliasNameInput = document.querySelector("#create-alias-notes") as HTMLInputElement;

type ValidationIssue = {
  level: "warning" | "error",
  message: string,
}

const validateAliasName = (name: string): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (name === "") {
    issues.push({ level: "error", message: "You must enter a name."});
  }
  return issues;
}

const validateAliasCode = (code: string): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (code === "") {
    issues.push({ level: "error", message: "You must enter a code."});
  }
  // TODO: uniqueness constraint
  return issues;
}

const validateAliasLink = (link: string): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (link === "") {
    issues.push({ level: "error", message: "You must enter a link."});
  }
  // TODO: uniqueness constraint
  return issues;
}

createAliasNameInput.addEventListener("input", () => {
  const value = createAliasNameInput.value;
  if (value === "") {
    createAliasNameInput.setCustomValidity("Name cannot be empty.");
  } else {
    createAliasNameInput.setCustomValidity("");
  }
});

createAliasCodeInput.addEventListener("input", () => {
  const value = createAliasCodeInput.value;
  if (value === "") {
    createAliasCodeInput.setCustomValidity("Code cannot be empty.");
  } else {
    createAliasCodeInput.setCustomValidity("");
  }
});

currentPageButton.addEventListener("click", () => {
  browser.tabs.query({ currentWindow: true, active: true })
    .then(tabs => {
      createAliasLinkInput.value = tabs[0].url ?? "";
    });
})

const createAliasForm = document.querySelector("#create-alias") as HTMLFormElement;
createAliasForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const newAlias: AliasCreate = {
    name: createAliasNameInput.value.trim(),
    code: createAliasCodeInput.value.trim(),
    link: createAliasLinkInput.value.trim(),
  }
  const response = await messenger.send({
    type: RequestType.ALIAS_CREATE,
    data: newAlias,
  });
  if (response.type === ResponseType.ERROR) {
    console.error("error creating alias: " + response.data.message);
    return;
  }
  createAliasNameInput.value = "";
  createAliasCodeInput.value = "";
  createAliasLinkInput.value = "https://";
  refreshAliasList();
});


const aliasList = document.querySelector("#aliases");

aliasList?.addEventListener("delete", async event => {
  const deleteId = (event as unknown as CustomEvent).detail;
  messenger.send({
    type: RequestType.ALIAS_DELETE,
    data: { id: deleteId },
  });
});

const updateDebouncers: Map<string, { timeout: NodeJS.Timeout, update: AliasUpdate }> = new Map();

aliasList?.addEventListener("update", async event => {
  const update = (event as unknown as CustomEvent).detail as AliasUpdate;
  const id = update.id;
  setUpdateTimeout(id, update);
});

const setUpdateTimeout = (id: string, update: AliasUpdate) => {
  const existingDebounce = updateDebouncers.get(id);
  if (existingDebounce === undefined) {
    const timeout = setTimeout(updateTimeoutCallback(id), 1000);
    updateDebouncers.set(id, { timeout, update });
    return;
  }
  const { timeout: existingTimeout, update: existingUpdate } = existingDebounce;
  clearTimeout(existingTimeout);
  const newUpdate = { ...existingUpdate, ...update };
  existingDebounce.update = newUpdate;
  existingDebounce.timeout = setTimeout(updateTimeoutCallback(id), 1000);
}

const updateTimeoutCallback = (id: string) => () => {
  const updateDebounce = updateDebouncers.get(id);
  if (updateDebounce === undefined) {
    return;
  }
  const { update } = updateDebounce;
  updateDebouncers.delete(id);
  messenger.send({
    type: RequestType.ALIAS_UPDATE,
    data: update,
  });
}

const search = document.querySelector("#search") as HTMLInputElement;

const refreshAliasList = async () => {
  const aliasesResponse = await messenger.send({ type: RequestType.ALIASES_GET });
  if (aliasesResponse.type !== ResponseType.ALIASES_GET) {
    return;
  }
  const aliases = aliasesResponse.data;
  const newNodes = aliases.map(makeAliasEntry);
  newNodes.length > 0
    ? aliasList?.replaceChildren(...newNodes)
    : aliasList?.replaceChildren(makeNoAliases());
  filterAliases(search.value);
}

refreshAliasList();

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
  const codeInput = document.createElement("input");
  codeInput.id = `alias-${alias.id}`;
  codeInput.ariaLabel = "Alias";
  codeInput.type = "text";
  codeInput.value = alias.code;
  codeInput.addEventListener("input", () => {
    codeInput.dispatchEvent(new CustomEvent("update", {
      detail: {
        id: alias.id,
        code: codeInput.value,
      },
      bubbles: true,
    }));
  })

  const title = document.createElement("h2");
  title.appendChild(codeInput);

  const linkInput = document.createElement("input");
  linkInput.id = `link-${alias.id}`;
  linkInput.type = "text";
  linkInput.value = alias.link;
  linkInput.addEventListener("input", () => {
    linkInput.dispatchEvent(new CustomEvent("update", {
      detail: {
        id: alias.id,
        link: linkInput.value,
      },
      bubbles: true,
    }));
  })

  const linkLabel = document.createElement("label");
  linkLabel.htmlFor = `link-${alias.id}`;
  linkLabel.innerText = "Link:";

  const link = document.createElement("div");
  link.appendChild(linkLabel);
  link.appendChild(linkInput);

  const notesLabel = document.createElement("label");
  notesLabel.htmlFor = `notes-${alias.id}`;
  notesLabel.innerText = "Notes:";

  const notesInput = document.createElement("input");
  notesInput.id = `notes-${alias.id}`;
  notesInput.type = "text";
  notesInput.value = alias.name;
  notesInput.ariaLabel = "Notes";
  notesInput.addEventListener("input", () => {
    notesInput.dispatchEvent(new CustomEvent("update", {
      detail: {
        id: alias.id,
        name: notesInput.value,
      },
      bubbles: true,
    }));
  })

  const notes = document.createElement("div");
  notes.appendChild(notesLabel);
  notes.appendChild(notesInput);

  const inputs = document.createElement("div");
  inputs.classList.add("input-container");
  inputs.appendChild(link);
  inputs.appendChild(notes);

  const deleteButton = document.createElement("button");
  deleteButton.innerHTML = `<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-trash-2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>`
  deleteButton.classList.add("delete");
  deleteButton.addEventListener("click", () => {
    deleteButton.dispatchEvent(new CustomEvent("delete", {
      detail: alias.id,
      bubbles: true,
    }));
  });

  const header = document.createElement("header");
  header.classList.add("grow-first");
  header.appendChild(title);
  header.appendChild(deleteButton);

  const footer = document.createElement("footer");

  const container = document.createElement("li");
  container.classList.add("alias-list-entry");
  container.appendChild(header);
  container.appendChild(inputs);
  container.appendChild(footer);
  container.dataset.alias = alias.code;
  container.dataset.id = alias.id;
  return container;
}