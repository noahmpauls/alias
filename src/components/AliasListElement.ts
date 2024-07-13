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
  private aliasList: HTMLUListElement | undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    this.searchInput = this.querySelector("#search") as HTMLInputElement;
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
    for (const aliasListing of this.aliasList?.querySelectorAll("li") ?? []) {
      const code = aliasListing.dataset.code;
      if (code === undefined) {
        return;
      }
      aliasListing.style.display = code?.startsWith(filter)
        ? "block"
        : "none";
    }
  }

  //////////////////////////////////////////////////////////
  // List Changes
  //////////////////////////////////////////////////////////

  createAlias = (alias: Alias) => {
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
  }

  deleteAlias = (alias: Alias) => {
    const deletedListing = this.aliasList?.querySelector(`li[data-id="${alias.id}"`);
    deletedListing?.remove();
    if (this.listingsCount() === 0) {
      this.aliasList?.replaceChildren(this.createNoAliases());
    }
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
}