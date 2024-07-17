import { RequestType, ResponseType, type IClientMessenger } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { AliasManagerElement } from "./AliasManagerElement";
import type { Alias } from "@alias/alias";

const ALIAS_LIST_NAME = "alias-list";

export class AliasListElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_LIST_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_LIST_NAME)) {
      window.AliasListElement = AliasListElement;
      window.customElements.define(ALIAS_LIST_NAME, AliasListElement);
    }
  }

  private messenger: IClientMessenger;
  private searchInput: HTMLInputElement | undefined;
  private resultCount: HTMLSpanElement | undefined;
  private aliasList: HTMLUListElement | undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    this.searchInput = this.querySelector("#search") as HTMLInputElement;
    this.resultCount = this.querySelector("#result-count") as HTMLInputElement;
    this.aliasList = this.querySelector("#aliases") as HTMLUListElement;

    this.setupSearch();
    this.initializeList();
  }

  private initializeList = async () => {
    const aliasesResponse = await this.messenger.send({ type: RequestType.ALIASES_GET });
    if (aliasesResponse.type !== ResponseType.ALIASES_GET) {
      return;
    }
    const aliases = aliasesResponse.data.sort((a, b) => a.code.localeCompare(b.code));
    const newNodes = aliases.map(this.createListing);
    newNodes.length > 0
      ? this.aliasList?.replaceChildren(...newNodes)
      : this.aliasList?.replaceChildren(this.createNoAliases());
    this.filterList(this.searchInput?.value);
  }

  //////////////////////////////////////////////////////////
  // Search Bar 
  //////////////////////////////////////////////////////////

  private setupSearch = () => {
    this.searchInput?.addEventListener("input", () => {
      this.filterList(this.searchInput?.value);
    });
  }

  private filterList = (filter: string = "") => {
    let filterFn = this.createAliasFilter(filter);
    for (const aliasListing of this.aliasList?.querySelectorAll("alias-manager") ?? []) {
      const alias: Alias = {
        id: aliasListing.dataset.id ?? "",
        code: aliasListing.dataset.code ?? "",
        link: aliasListing.dataset.link ?? "",
        note: aliasListing.dataset.note ?? "",
      }
      const visible = filterFn(alias)
      aliasListing.style.display = visible ? "" : "none";
    }
    this.refreshResultCount();
  }

  private createAliasFilter = (filter: string) => {
    const lowerFilter = filter.toLocaleLowerCase();
    return (alias: Alias) => {
      const fullMatch = (
        alias.code.includes(filter) ||
        alias.link.toLocaleLowerCase().includes(lowerFilter) ||
        alias.note.toLocaleLowerCase().includes(lowerFilter)
      );
      if (fullMatch) {
        return true;
      }
      
      if (
        filter.startsWith("c:") &&
        alias.code.includes(filter.substring(2))
      ) {
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
    }
  }

  //////////////////////////////////////////////////////////
  // List Changes
  //////////////////////////////////////////////////////////

  createAlias = (alias: Alias) => {
    this.addAliasListing(alias);
    this.refreshResultCount();
  }

  private addAliasListing = (alias: Alias) => {
    const newListing = this.createListing(alias);
    if (this.listingsCount() === 0) {
      this.aliasList?.replaceChildren(newListing);      
      return;
    }
    // insert in sorted order by code
    const listings = this.aliasList?.querySelectorAll(`li[data-id]`) ?? [];
    for (const listing of listings) {
      const code = (listing as HTMLElement).dataset.code ?? "";
      if (alias.code.localeCompare(code) < 0) {
        this.aliasList?.insertBefore(newListing, listing)
        return;
      }
    }
    this.aliasList?.appendChild(newListing);
  }

  updateAlias = (alias: Alias) => {
    const updatedListing = this.aliasList?.querySelector(`li[data-id="${alias.id}"`);
    updatedListing?.replaceWith(this.createListing(alias));
    this.refreshResultCount();
  }

  deleteAlias = (alias: Alias) => {
    const deletedListing = this.aliasList?.querySelector(`li[data-id="${alias.id}"`);
    deletedListing?.remove();
    if (this.listingsCount() === 0) {
      this.aliasList?.replaceChildren(this.createNoAliases());
    }
    this.refreshResultCount();
  }

  private listingsCount = (): number => {
    return this.aliasList?.querySelectorAll("li[data-id]").length ?? 0;
  }

  private createNoAliases = () : HTMLElement => {
    const noAliases = document.getElementById("no-aliases") as HTMLTemplateElement;
    const container = document.createElement("li");
    container.appendChild(noAliases.content.cloneNode(true));
    return container;
  }

  private createListing = (alias: Alias): HTMLElement => {
    const manager = this.createAliasManager(alias);
    const container = document.createElement("li");
    container.dataset.id = alias.id;
    container.dataset.code = alias.code;
    container.appendChild(manager);
    return container;
  }

  private createAliasManager = (alias: Alias): AliasManagerElement => {
    const template = AliasManagerElement.initializeTemplate(alias);
    const manager = document.createElement("alias-manager");
    manager.replaceChildren(template);
    manager.dataset.id = alias.id;
    manager.dataset.code = alias.code;
    manager.dataset.link = alias.link;
    manager.dataset.note = alias.note;
    return manager;
  }

  //////////////////////////////////////////////////////////
  // Result Counter
  //////////////////////////////////////////////////////////

  private refreshResultCount = () => {
    if (this.resultCount === undefined) {
      return;
    }
    const total = this.getTotalAliases();
    const visible = this.getVisibleAliases();
    const isSearching = (this.searchInput?.value.length ?? 0) !== 0;
    const countText = isSearching
      ? `${visible}\xa0/\xa0${total}`
      : `${total}`;
    this.resultCount.innerText = `${countText} result${total !== 1 ? "s" : "\xa0"}`
  }

  private getTotalAliases = (): number => {
    return this.aliasList?.querySelectorAll("alias-manager").length ?? 0;
  }

  private getVisibleAliases = (): number => {
    return [...this.aliasList?.querySelectorAll("alias-manager") ?? []]
      .filter((a: HTMLElement) => a.style.display !== "none")
      .length ?? 0;
  }
}