import type { Alias } from "@alias/alias";
import {
  type IClientMessenger,
  RequestType,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { AliasManagerElement } from "./AliasManagerElement";

const ALIAS_LIST_NAME = "alias-list";

declare global {
  interface Window {
    AliasListElement: typeof AliasListElement;
  }
  interface HTMLElementTagNameMap {
    [AliasListElement.ELEMENT_NAME]: AliasListElement;
  }
}

type ConnectedState = {
  searchInput: HTMLInputElement;
  resultCount: HTMLSpanElement;
  aliasList: HTMLUListElement;
};

export class AliasListElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_LIST_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_LIST_NAME)) {
      window.AliasListElement = AliasListElement;
      window.customElements.define(ALIAS_LIST_NAME, AliasListElement);
    }
  };

  private messenger: IClientMessenger;
  private state: ConnectedState | undefined = undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    const searchInput = this.querySelector<HTMLInputElement>("#search");
    const resultCount = this.querySelector<HTMLSpanElement>("#result-count");
    const aliasList = this.querySelector<HTMLUListElement>("#aliases");

    if (!searchInput || !resultCount || !aliasList) {
      return;
    }

    this.state = { searchInput, resultCount, aliasList };

    this.setupSearch();
    this.initializeList();
  }

  private initializeList = async () => {
    if (this.state === undefined) return;
    const aliasesResponse = await this.messenger.send({
      type: RequestType.ALIASES_GET,
    });
    if (aliasesResponse.type !== ResponseType.ALIASES_GET) {
      return;
    }
    const aliases = aliasesResponse.data.sort((a, b) =>
      a.code.localeCompare(b.code),
    );
    const newNodes = aliases.map(this.createListing);
    newNodes.length > 0
      ? this.state.aliasList.replaceChildren(...newNodes)
      : this.state.aliasList.replaceChildren(this.createNoAliases());
    this.filterList(this.state.searchInput.value);
  };

  //////////////////////////////////////////////////////////
  // Search Bar
  //////////////////////////////////////////////////////////

  private setupSearch = () => {
    if (this.state === undefined) return;
    this.state.searchInput.addEventListener("input", () => {
      if (this.state === undefined) return;
      this.filterList(this.state.searchInput.value);
    });
  };

  private filterList = (filter: string = "") => {
    if (this.state === undefined) return;
    const filterFn = this.createAliasFilter(filter);
    for (const aliasListing of this.state.aliasList.querySelectorAll(
      "alias-manager",
    )) {
      const alias: Alias = {
        id: aliasListing.dataset.id ?? "",
        code: aliasListing.dataset.code ?? "",
        link: aliasListing.dataset.link ?? "",
        note: aliasListing.dataset.note ?? "",
      };
      const visible = filterFn(alias);
      aliasListing.style.display = visible ? "" : "none";
    }
    this.refreshResultCount();
  };

  private createAliasFilter = (filter: string) => {
    const lowerFilter = filter.toLocaleLowerCase();
    return (alias: Alias) => {
      const fullMatch =
        alias.code.includes(filter) ||
        alias.link.toLocaleLowerCase().includes(lowerFilter) ||
        alias.note.toLocaleLowerCase().includes(lowerFilter);
      if (fullMatch) {
        return true;
      }

      if (filter.startsWith("c:") && alias.code.includes(filter.substring(2))) {
        return true;
      }

      if (
        filter.startsWith("l:") &&
        alias.link.toLocaleLowerCase().includes(lowerFilter.substring(2))
      ) {
        return true;
      }

      if (
        filter.startsWith("n:") &&
        alias.note.toLocaleLowerCase().includes(lowerFilter.substring(2))
      ) {
        return true;
      }
    };
  };

  //////////////////////////////////////////////////////////
  // List Changes
  //////////////////////////////////////////////////////////

  createAlias = (alias: Alias) => {
    this.addAliasListing(alias);
    this.refreshResultCount();
  };

  private addAliasListing = (alias: Alias) => {
    if (this.state === undefined) return;
    const newListing = this.createListing(alias);
    if (this.listingsCount() === 0) {
      this.state.aliasList.replaceChildren(newListing);
      return;
    }
    // insert in sorted order by code
    const listings = this.state.aliasList.querySelectorAll(`li[data-id]`);
    for (const listing of listings) {
      const code = (listing as HTMLElement).dataset.code ?? "";
      if (alias.code.localeCompare(code) < 0) {
        this.state.aliasList.insertBefore(newListing, listing);
        return;
      }
    }
    this.state.aliasList.appendChild(newListing);
  };

  updateAlias = (alias: Alias) => {
    if (this.state === undefined) return;
    const updatedListing = this.state.aliasList.querySelector(
      `li[data-id="${alias.id}"`,
    );
    updatedListing?.replaceWith(this.createListing(alias));
    this.refreshResultCount();
  };

  deleteAlias = (alias: Alias) => {
    if (this.state === undefined) return;
    const deletedListing = this.state.aliasList.querySelector(
      `li[data-id="${alias.id}"`,
    );
    deletedListing?.remove();
    if (this.listingsCount() === 0) {
      this.state.aliasList.replaceChildren(this.createNoAliases());
    }
    this.refreshResultCount();
  };

  private listingsCount = (): number => {
    if (this.state === undefined) return 0;
    return this.state.aliasList.querySelectorAll("li[data-id]").length;
  };

  private createNoAliases = (): HTMLElement => {
    const noAliases = document.getElementById(
      "no-aliases",
    ) as HTMLTemplateElement;
    const container = document.createElement("li");
    container.appendChild(noAliases.content.cloneNode(true));
    return container;
  };

  private createListing = (alias: Alias): HTMLElement => {
    const manager = this.createAliasManager(alias);
    const container = document.createElement("li");
    container.dataset.id = alias.id;
    container.dataset.code = alias.code;
    container.appendChild(manager);
    return container;
  };

  private createAliasManager = (alias: Alias): AliasManagerElement => {
    const template = AliasManagerElement.initializeTemplate(alias);
    const manager = document.createElement("alias-manager");
    manager.replaceChildren(template);
    manager.dataset.id = alias.id;
    manager.dataset.code = alias.code;
    manager.dataset.link = alias.link;
    manager.dataset.note = alias.note;
    return manager;
  };

  //////////////////////////////////////////////////////////
  // Result Counter
  //////////////////////////////////////////////////////////

  private refreshResultCount = () => {
    if (this.state === undefined) return;
    const total = this.getTotalAliases();
    const visible = this.getVisibleAliases();
    const isSearching = this.state.searchInput.value.length !== 0;
    const countText = isSearching ? `${visible}\xa0/\xa0${total}` : `${total}`;
    this.state.resultCount.innerText = `${countText} result${total !== 1 ? "s" : "\xa0"}`;
  };

  private getTotalAliases = (): number => {
    if (this.state === undefined) return 0;
    return this.state.aliasList.querySelectorAll("alias-manager").length;
  };

  private getVisibleAliases = (): number => {
    if (this.state === undefined) return 0;
    return [...this.state.aliasList.querySelectorAll("alias-manager")].filter(
      (a: HTMLElement) => a.style.display !== "none",
    ).length;
  };
}
