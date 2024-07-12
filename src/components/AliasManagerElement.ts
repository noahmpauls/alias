import type { Alias, AliasUpdate, AliasDelete } from "@alias/alias";
import { RequestType, type IClientMessenger } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";

const ELEMENT_NAME = "alias-manager";

export class AliasManagerElement extends HTMLElement {
  static readonly ELEMENT_NAME = ELEMENT_NAME;

  static register = () => {
    if (!window.customElements.get(ELEMENT_NAME)) {
      window.AliasManagerElement = AliasManagerElement;
      window.customElements.define(ELEMENT_NAME, AliasManagerElement);
    }
  }

  private messenger: IClientMessenger;
  private alias: Alias | undefined;
  private codeInput: HTMLInputElement | undefined;
  private linkInput: HTMLInputElement | undefined;
  private noteInput: HTMLInputElement | undefined;
  private deleteButton: HTMLButtonElement | undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    this.alias = this.getAliasData();
    if (this.alias === undefined) {
      return;
    }

    this.codeInput = this.querySelector(`#alias-${this.alias.id}`) as HTMLInputElement;
    this.codeInput.value = this.alias.code;
    this.linkInput = this.querySelector(`#link-${this.alias.id}`) as HTMLInputElement;
    this.linkInput.value = this.alias.link;
    this.noteInput = this.querySelector(`#note-${this.alias.id}`) as HTMLInputElement;
    this.noteInput.value = this.alias.name;
    this.deleteButton = this.querySelector(`#delete-${this.alias.id}`) as HTMLButtonElement;

    this.codeInput.addEventListener("input", () => {
      if (this.alias === undefined || this.codeInput === undefined) return;
      const aliasUpdate = { id: this.alias.id, code: this.codeInput.value };
      this.requestUpdate(aliasUpdate)
      this.dispatchUpdate(aliasUpdate);
    });
    this.linkInput.addEventListener("input", () => {
      if (this.alias === undefined || this.linkInput === undefined) return;
      const aliasUpdate = { id: this.alias.id, link: this.linkInput.value };
      this.requestUpdate(aliasUpdate)
      this.dispatchUpdate(aliasUpdate);
    });
    this.noteInput.addEventListener("input", () => {
      if (this.alias === undefined || this.noteInput === undefined) return;
      const aliasUpdate = { id: this.alias.id, name: this.noteInput.value };
      this.requestUpdate(aliasUpdate)
      this.dispatchUpdate(aliasUpdate);
    });
    this.deleteButton.addEventListener("click", () => {
      if (this.alias === undefined || this.deleteButton === undefined) return;
      const deleteAlias = { id: this.alias.id };
      this.requestDelete(deleteAlias);
      this.dispatchDelete(deleteAlias);
    });
  }

  private getAliasData = (): Alias | undefined => {
    const id = this.dataset.id;
    const code = this.dataset.alias;
    const link = this.dataset.link;
    const note = this.dataset.note;
    if (id === undefined || code === undefined || link === undefined || note === undefined) {
      return undefined;
    }
    return { id, code, link, name: note };
  }

  private requestUpdate = (aliasUpdate: AliasUpdate) => {
    this.messenger.send({
      type: RequestType.ALIAS_UPDATE,
      data: aliasUpdate,
    });
  }

  private dispatchUpdate = (aliasUpdate: AliasUpdate) => {
    this.dispatchEvent(new CustomEvent("updatealias", {
      detail: aliasUpdate,
      bubbles: true,
    }));
  }

  private requestDelete = (aliasDelete: AliasDelete) => {
    this.messenger.send({
      type: RequestType.ALIAS_DELETE,
      data: aliasDelete,
    });
  }

  private dispatchDelete = (aliasDelete: AliasDelete) => {
    this.dispatchEvent(new CustomEvent("deletealias", {
      detail: aliasDelete,
      bubbles: true,
    }));
  }

  static initializeTemplate = (alias: Alias): HTMLElement => {
    const templateElement = document.getElementById(ELEMENT_NAME) as HTMLTemplateElement;
    const template = templateElement.content.cloneNode(true) as HTMLElement;
    for (const field of ["alias", "link", "note"]) {
      const input = template.querySelector(`#${field}-id`) as HTMLInputElement;
      const label = template.querySelector(`[for="${field}-id"`) as HTMLLabelElement | null;
      input.id = `${field}-${alias.id}`;
      if (label !== null) {
        label.htmlFor = `${field}-${alias.id}`;
      }
    }
    const button = template.querySelector("#delete-id") as HTMLButtonElement;
    button.id = `delete-${alias.id}`;
    return template;
  }
}
