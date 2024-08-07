import type { Alias, AliasUpdate, AliasDelete } from "@alias/alias";
import { RequestType, ResponseType, type IClientMessenger, type ResponseMessage } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";

const ALIAS_MANAGER_NAME = "alias-manager";

export class AliasManagerElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_MANAGER_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_MANAGER_NAME)) {
      window.AliasManagerElement = AliasManagerElement;
      window.customElements.define(ALIAS_MANAGER_NAME, AliasManagerElement);
    }
  }

  private messenger: IClientMessenger;
  private alias: Alias | undefined;
  private form : HTMLFormElement | null = null;
  private codeInput: HTMLInputElement | null = null;
  private linkInput: HTMLInputElement | null = null;
  private noteInput: HTMLInputElement | null = null;
  private deleteButton: HTMLButtonElement | null = null;
  private submitButton: HTMLButtonElement | null = null;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    this.alias = this.getAliasData();
    if (this.alias === undefined) {
      return;
    }

    this.form = this.querySelector(`#alias-manager-${this.alias.id}`);
    this.codeInput = this.querySelector(`#code-${this.alias.id}`);
    if (this.codeInput !== null) {
      this.codeInput.value = this.alias.code;
    }
    this.linkInput = this.querySelector(`#link-${this.alias.id}`);
    if (this.linkInput !== null) {
      this.linkInput.value = this.alias.link;
    }
    this.noteInput = this.querySelector(`#note-${this.alias.id}`);
    if (this.noteInput !== null) {
      this.noteInput.value = this.alias.note;
    }
    this.deleteButton = this.querySelector(`#delete-${this.alias.id}`);
    this.submitButton = this.querySelector(`#submit-${this.alias.id}`);

    if (!this.isReadonly()) {
      this.setupDeleteButton();
      this.setupCodeInput();
      this.setupLinkInput();
      this.setupForm();
    } else {
      this.removeDeleteButton();
      this.disableForm();      
      this.setInputsReadonly();
    }
  }

  private getAliasData = (): Alias | undefined => {
    const id = this.dataset.id;
    const code = this.dataset.code;
    const link = this.dataset.link;
    const note = this.dataset.note;
    if (id === undefined || code === undefined || link === undefined || note === undefined) {
      return undefined;
    }
    return { id, code, link, note: note };
  }

  private isReadonly = (): boolean => {
    return this.getAttribute("readonly") === "true";
  }

  private readonlyCodeValidity = (): string | null => {
    return this.getAttribute("readonly-code-validity");
  }

  //////////////////////////////////////////////////////////
  // Delete Button
  //////////////////////////////////////////////////////////

  private setupDeleteButton = () => {
    this.deleteButton?.addEventListener("click", async () => {
      const aliasDelete = { id: this.alias!.id };
      const response = await this.requestDelete(aliasDelete);
      if (response.type === ResponseType.ALIAS_DELETE) {
        const deletedAlias = response.data;
        this.dispatchDelete(deletedAlias);
      }
    })
  }

  private requestDelete = async (aliasDelete: AliasDelete): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_DELETE,
      data: aliasDelete,
    });
  }

  private dispatchDelete = (deletedAlias: Alias) => {
    this.dispatchEvent(new CustomEvent("deletealias", {
      detail: deletedAlias,
      bubbles: true,
    }));
  }

  private removeDeleteButton = () => {
    this.deleteButton?.remove();
  }

  //////////////////////////////////////////////////////////
  // Code Input Validation
  //////////////////////////////////////////////////////////

  private setupCodeInput = () => {
    this.codeInput?.addEventListener("input", this.codeOnChange);
    this.codeInput?.addEventListener("blur", this.codeOnBlur);
  }

  private codeOnChange = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      return;
    }
    const value = this.codeInput?.value ?? "";
    if (value === "") {
      this.setCodeValidity("Must provide an alias.");
    }
  }

  private codeOnBlur = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      return;
    }
    this.codeInput!.value = "";
    this.setCodeValidity("Must provide an alias.");
  }

  private validateCode = () => {
    return this.codeInput?.value.trim() ?? "" !== "";    
  }

  private setCodeValidity = (message?: string) => {
    const validation = this.querySelector(`#code-${this.alias?.id}-validation`) as HTMLElement
    if (message) {
      this.codeInput?.classList.add("invalid");
      this.codeInput?.setCustomValidity(message);
      validation.innerText = message;
    } else {
      this.codeInput?.classList.remove("invalid");
      this.codeInput?.setCustomValidity("");
      validation.innerText = "";
    }
  }

  //////////////////////////////////////////////////////////
  // Link Input Validation
  //////////////////////////////////////////////////////////

  private setupLinkInput = () => {
    this.linkInput?.addEventListener("input", this.linkOnChange);
    this.linkInput?.addEventListener("blur", this.linkOnBlur);
  }

  private linkOnChange = () => {
    if (this.validateLink()) {
      this.setLinkValidity();
      return;
    }
    this.setLinkValidity("Must provide a valid link.");
  }

  private linkOnBlur = () => {
    if (this.validateLink()) {
      this.setLinkValidity();
      return;
    }
    if ((this.linkInput?.value.trim() ?? "") === "") {
      this.linkInput!.value = "https://";
    }
    this.setLinkValidity("Must provide a valid link.");
  }

  private validateLink = () => {
    const link = this.linkInput?.value.trim() ?? "";
    return this.tryCreateUrl(link) !== undefined;
  }

  private tryCreateUrl(link: string): URL | undefined {
    try {
      return new URL(link);
    } catch {
      return undefined;
    }
  }

  private setLinkValidity = (message?: string) => {
    const validation = this.querySelector(`#link-${this.alias?.id}-validation`) as HTMLElement
    if (message) {
      this.linkInput?.classList.add("invalid");
      this.linkInput?.setCustomValidity(message);
      validation.innerText = message;
    } else {
      this.linkInput?.classList.remove("invalid");
      this.linkInput?.setCustomValidity("");
      validation.innerText = "";
    }
  }

  //////////////////////////////////////////////////////////
  // Submission Handling
  //////////////////////////////////////////////////////////

  private setupForm = () => {
    this.form?.addEventListener("submit", this.handleSubmit);
    const updateListener = () => this.setChangeVisibility(this.aliasCanUpdate());
    for (const input of [this.codeInput, this.linkInput, this.noteInput]) {
      input?.addEventListener("input", updateListener);
      input?.addEventListener("blur", updateListener);
    }
  }

  private handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!this.validateAlias()) {
      this.codeOnBlur();
      this.linkOnBlur();
      return;
    }
    const aliasUpdate = this.createAliasUpdate();
    const response = await this.requestUpdate(aliasUpdate);
    if (response.type === ResponseType.ERROR) {
      this.setSubmitValidity(`Error: ${response.data.message}`);
      console.error(response.data.message);
      return;
    }
    if (response.type === ResponseType.ALIAS_UPDATE) {
      const updatedAlias = response.data;
      this.dispatchUpdate(updatedAlias);
    }
  }

  private validateAlias = () => {
    return this.validateCode() && this.validateLink();
  }

  private createAliasUpdate = (): AliasUpdate => {
    return {
      id: this.alias?.id ?? "",
      code: this.codeInput?.value.trim() ?? "",
      link: this.linkInput?.value.trim() ?? "",
      note: this.noteInput?.value.trim() ?? "",
    }
  }

  private requestUpdate = async (aliasUpdate: AliasUpdate): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_UPDATE,
      data: aliasUpdate,
    });
  }

  private dispatchUpdate = (updatedAlias: Alias) => {
    this.dispatchEvent(new CustomEvent("updatealias", {
      detail: updatedAlias,
      bubbles: true,
    }));
  }

  private setSubmitValidity = (message?: string) => {
    const validation = this.querySelector(`#submit-${this.alias?.id}-validation`) as HTMLElement
    if (message) {
      validation.innerText = message;
    } else {
      validation.innerText = "";
    }
  }

  private setChangeVisibility = (visible: boolean) => {
    if (visible) {
      this.submitButton!.style.display = "";
      this.classList.add("changed");
    } else {
      this.submitButton!.style.display = "none";
      this.classList.remove("changed");
    }
  }

  private aliasCanUpdate = (): boolean => {
    const codeUpdated = this.codeInput?.value !== this.alias?.code;
    const linkUpdated = this.linkInput?.value !== this.alias?.link;
    const noteUpdated = this.noteInput?.value !== this.alias?.note;
    return codeUpdated || linkUpdated || noteUpdated;
  }

  private disableForm = () => {
    this.form?.addEventListener("submit", (event: SubmitEvent) => {
      event.preventDefault();
    });
  }

  private setInputsReadonly = () => {
    if (this.codeInput !== null) {
      this.codeOnChange();
      const customValidity = this.readonlyCodeValidity();
      if (customValidity) {
        this.setCodeValidity(customValidity);
      }
      this.codeInput.disabled = true;
    }
    if (this.linkInput !== null) {
      this.linkOnChange();
      this.linkInput.disabled = true;
    }
    if (this.noteInput !== null) {
      this.noteInput.disabled = true;
    }
  }

  //////////////////////////////////////////////////////////
  // Template Setup
  //////////////////////////////////////////////////////////

  static initializeTemplate = (alias: Alias): HTMLElement => {
    const templateElement = document.getElementById(ALIAS_MANAGER_NAME) as HTMLTemplateElement;
    const template = templateElement.content.cloneNode(true) as HTMLElement;
    const form = template.querySelector("#alias-manager-id") as HTMLFormElement;
    form.id = `alias-manager-${alias.id}`;
    for (const field of ["code", "link", "note"]) {
      const input = template.querySelector(`#${field}-id`) as HTMLInputElement;
      const label = template.querySelector(`[for="${field}-id"`) as HTMLLabelElement | null;
      input.id = `${field}-${alias.id}`;
      if (label !== null) {
        label.htmlFor = `${field}-${alias.id}`;
      }
    }
    for (const field of ["code", "link", "submit"]) {
      const validation = template.querySelector(`#${field}-id-validation`) as HTMLElement;
      validation.id = `${field}-${alias.id}-validation`;
    }
    const submitButton = template.querySelector("#submit-id") as HTMLButtonElement;
    submitButton.id = `submit-${alias.id}`;
    const deleteButton = template.querySelector("#delete-id") as HTMLButtonElement;
    deleteButton.id = `delete-${alias.id}`;
    return template;
  }
}
