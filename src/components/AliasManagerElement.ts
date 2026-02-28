import type { Alias, AliasDelete, AliasUpdate } from "@alias/alias";
import {
  type IClientMessenger,
  RequestType,
  type ResponseMessage,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";

const ALIAS_MANAGER_NAME = "alias-manager";

declare global {
  interface Window {
    AliasManagerElement: typeof AliasManagerElement;
  }
  interface HTMLElementTagNameMap {
    [ALIAS_MANAGER_NAME]: AliasManagerElement;
  }
}

type ConnectedState = {
  alias: Alias;
  form: HTMLFormElement;
  codeInput: HTMLInputElement;
  linkInput: HTMLInputElement;
  noteInput: HTMLInputElement;
  deleteButton: HTMLButtonElement;
  submitButton: HTMLButtonElement;
};

export class AliasManagerElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_MANAGER_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_MANAGER_NAME)) {
      window.AliasManagerElement = AliasManagerElement;
      window.customElements.define(ALIAS_MANAGER_NAME, AliasManagerElement);
    }
  };

  private messenger: IClientMessenger;
  private state: ConnectedState | undefined = undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    const alias = this.getAliasData();
    if (alias === undefined) {
      return;
    }

    const form = this.querySelector<HTMLFormElement>(
      `#alias-manager-${alias.id}`,
    );
    const codeInput = this.querySelector<HTMLInputElement>(`#code-${alias.id}`);
    const linkInput = this.querySelector<HTMLInputElement>(`#link-${alias.id}`);
    const noteInput = this.querySelector<HTMLInputElement>(`#note-${alias.id}`);
    const deleteButton = this.querySelector<HTMLButtonElement>(
      `#delete-${alias.id}`,
    );
    const submitButton = this.querySelector<HTMLButtonElement>(
      `#submit-${alias.id}`,
    );

    if (
      !form ||
      !codeInput ||
      !linkInput ||
      !noteInput ||
      !deleteButton ||
      !submitButton
    ) {
      return;
    }

    this.state = {
      alias,
      form,
      codeInput,
      linkInput,
      noteInput,
      deleteButton,
      submitButton,
    };

    codeInput.value = alias.code;
    linkInput.value = alias.link;
    noteInput.value = alias.note;

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
    if (
      id === undefined ||
      code === undefined ||
      link === undefined ||
      note === undefined
    ) {
      return undefined;
    }
    return { id, code, link, note: note };
  };

  private isReadonly = (): boolean => {
    return this.getAttribute("readonly") === "true";
  };

  private readonlyCodeValidity = (): string | null => {
    return this.getAttribute("readonly-code-validity");
  };

  //////////////////////////////////////////////////////////
  // Delete Button
  //////////////////////////////////////////////////////////

  private setupDeleteButton = () => {
    if (this.state === undefined) return;
    this.state.deleteButton.addEventListener("click", async () => {
      if (this.state === undefined) return;
      const aliasDelete = { id: this.state.alias.id };
      const response = await this.requestDelete(aliasDelete);
      if (response.type === ResponseType.ALIAS_DELETE) {
        const deletedAlias = response.data;
        this.dispatchDelete(deletedAlias);
      }
    });
  };

  private requestDelete = async (
    aliasDelete: AliasDelete,
  ): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_DELETE,
      data: aliasDelete,
    });
  };

  private dispatchDelete = (deletedAlias: Alias) => {
    this.dispatchEvent(
      new CustomEvent("deletealias", {
        detail: deletedAlias,
        bubbles: true,
      }),
    );
  };

  private removeDeleteButton = () => {
    if (this.state === undefined) return;
    this.state.deleteButton.remove();
  };

  //////////////////////////////////////////////////////////
  // Code Input Validation
  //////////////////////////////////////////////////////////

  private setupCodeInput = () => {
    if (this.state === undefined) return;
    this.state.codeInput.addEventListener("input", this.codeOnChange);
    this.state.codeInput.addEventListener("blur", this.codeOnBlur);
  };

  private codeOnChange = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      return;
    }

    if (this.state === undefined) return;
    if (this.state.codeInput.value === "") {
      this.setCodeValidity("Must provide an alias.");
    }
  };

  private codeOnBlur = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      return;
    }

    if (this.state === undefined) return;
    this.state.codeInput.value = "";
    this.setCodeValidity("Must provide an alias.");
  };

  private validateCode = () => {
    if (this.state === undefined) return false;
    return this.state.codeInput.value.trim() !== "";
  };

  private setCodeValidity = (message?: string) => {
    if (this.state === undefined) return;
    const validation = this.querySelector(
      `#code-${this.state.alias.id}-validation`,
    ) as HTMLElement;
    if (message) {
      this.state.codeInput.classList.add("invalid");
      this.state.codeInput.setCustomValidity(message);
      validation.innerText = message;
    } else {
      this.state.codeInput.classList.remove("invalid");
      this.state.codeInput.setCustomValidity("");
      validation.innerText = "";
    }
  };

  //////////////////////////////////////////////////////////
  // Link Input Validation
  //////////////////////////////////////////////////////////

  private setupLinkInput = () => {
    if (this.state === undefined) return;
    this.state.linkInput.addEventListener("input", this.linkOnChange);
    this.state.linkInput.addEventListener("blur", this.linkOnBlur);
  };

  private linkOnChange = () => {
    if (this.validateLink()) {
      this.setLinkValidity();
      return;
    }
    this.setLinkValidity("Must provide a valid link.");
  };

  private linkOnBlur = () => {
    if (this.validateLink()) {
      this.setLinkValidity();
      return;
    }

    if (this.state === undefined) return;
    if (this.state.linkInput.value.trim() === "") {
      this.state.linkInput.value = "https://";
    }
    this.setLinkValidity("Must provide a valid link.");
  };

  private validateLink = () => {
    if (this.state === undefined) return false;
    return this.tryCreateUrl(this.state.linkInput.value.trim()) !== undefined;
  };

  private tryCreateUrl(link: string): URL | undefined {
    try {
      return new URL(link);
    } catch {
      return undefined;
    }
  }

  private setLinkValidity = (message?: string) => {
    if (this.state === undefined) return;
    const validation = this.querySelector(
      `#link-${this.state.alias.id}-validation`,
    ) as HTMLElement;
    if (message) {
      this.state.linkInput.classList.add("invalid");
      this.state.linkInput.setCustomValidity(message);
      validation.innerText = message;
    } else {
      this.state.linkInput.classList.remove("invalid");
      this.state.linkInput.setCustomValidity("");
      validation.innerText = "";
    }
  };

  //////////////////////////////////////////////////////////
  // Submission Handling
  //////////////////////////////////////////////////////////

  private setupForm = () => {
    if (this.state === undefined) return;
    this.state.form.addEventListener("submit", this.handleSubmit);
    const updateListener = () =>
      this.setChangeVisibility(this.aliasCanUpdate());
    for (const input of [
      this.state.codeInput,
      this.state.linkInput,
      this.state.noteInput,
    ]) {
      input.addEventListener("input", updateListener);
      input.addEventListener("blur", updateListener);
    }
  };

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
  };

  private validateAlias = () => {
    return this.validateCode() && this.validateLink();
  };

  private createAliasUpdate = (): AliasUpdate => {
    if (this.state === undefined) return { id: "" };
    return {
      id: this.state.alias.id,
      code: this.state.codeInput.value.trim(),
      link: this.state.linkInput.value.trim(),
      note: this.state.noteInput.value.trim(),
    };
  };

  private requestUpdate = async (
    aliasUpdate: AliasUpdate,
  ): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_UPDATE,
      data: aliasUpdate,
    });
  };

  private dispatchUpdate = (updatedAlias: Alias) => {
    this.dispatchEvent(
      new CustomEvent("updatealias", {
        detail: updatedAlias,
        bubbles: true,
      }),
    );
  };

  private setSubmitValidity = (message?: string) => {
    if (this.state === undefined) return;
    const validation = this.querySelector(
      `#submit-${this.state.alias.id}-validation`,
    ) as HTMLElement;
    if (message) {
      validation.innerText = message;
    } else {
      validation.innerText = "";
    }
  };

  private setChangeVisibility = (visible: boolean) => {
    if (this.state === undefined) return;
    if (visible) {
      this.state.submitButton.style.display = "";
      this.classList.add("changed");
    } else {
      this.state.submitButton.style.display = "none";
      this.classList.remove("changed");
    }
  };

  private aliasCanUpdate = (): boolean => {
    if (this.state === undefined) return false;
    const codeUpdated = this.state.codeInput.value !== this.state.alias.code;
    const linkUpdated = this.state.linkInput.value !== this.state.alias.link;
    const noteUpdated = this.state.noteInput.value !== this.state.alias.note;
    return codeUpdated || linkUpdated || noteUpdated;
  };

  private disableForm = () => {
    if (this.state === undefined) return;
    this.state.form.addEventListener("submit", (event: SubmitEvent) => {
      event.preventDefault();
    });
  };

  private setInputsReadonly = () => {
    if (this.state === undefined) return;
    this.codeOnChange();
    const customValidity = this.readonlyCodeValidity();
    if (customValidity) {
      this.setCodeValidity(customValidity);
    }
    this.state.codeInput.disabled = true;
    this.linkOnChange();
    this.state.linkInput.disabled = true;
    this.state.noteInput.disabled = true;
  };

  //////////////////////////////////////////////////////////
  // Template Setup
  //////////////////////////////////////////////////////////

  static initializeTemplate = (alias: Alias): HTMLElement => {
    const templateElement = document.getElementById(
      ALIAS_MANAGER_NAME,
    ) as HTMLTemplateElement;
    const template = templateElement.content.cloneNode(true) as HTMLElement;
    const form = template.querySelector("#alias-manager-id") as HTMLFormElement;
    form.id = `alias-manager-${alias.id}`;
    for (const field of ["code", "link", "note"]) {
      const input = template.querySelector(`#${field}-id`) as HTMLInputElement;
      const label = template.querySelector(
        `[for="${field}-id"`,
      ) as HTMLLabelElement | null;
      input.id = `${field}-${alias.id}`;
      if (label !== null) {
        label.htmlFor = `${field}-${alias.id}`;
      }
    }
    for (const field of ["code", "link", "submit"]) {
      const validation = template.querySelector(
        `#${field}-id-validation`,
      ) as HTMLElement;
      validation.id = `${field}-${alias.id}-validation`;
    }
    const submitButton = template.querySelector(
      "#submit-id",
    ) as HTMLButtonElement;
    submitButton.id = `submit-${alias.id}`;
    const deleteButton = template.querySelector(
      "#delete-id",
    ) as HTMLButtonElement;
    deleteButton.id = `delete-${alias.id}`;
    return template;
  };
}
