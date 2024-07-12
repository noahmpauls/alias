import type { AliasCreate } from "@alias/alias";
import { browser } from "@alias/browser";
import { RequestType, ResponseType, type IClientMessenger, type ResponseMessage } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";

const ALIAS_CREATOR_NAME = "alias-creator";

export class AliasCreatorElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_CREATOR_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_CREATOR_NAME)) {
      window.AliasCreatorElement = AliasCreatorElement;
      window.customElements.define(ALIAS_CREATOR_NAME, AliasCreatorElement);
    }
  }

  private messenger: IClientMessenger;
  private form: HTMLFormElement | undefined;
  private codeInput: HTMLInputElement | undefined;
  private linkInput: HTMLInputElement | undefined;
  private linkCurrentButton: HTMLButtonElement | undefined;
  private noteInput: HTMLInputElement | undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    this.form = this.querySelector("#alias-creator-form") as HTMLFormElement;
    this.codeInput = this.querySelector("#alias-creator-code") as HTMLInputElement;
    this.linkInput = this.querySelector("#alias-creator-link") as HTMLInputElement;
    this.noteInput = this.querySelector("#alias-creator-note") as HTMLInputElement;    
    this.linkCurrentButton = this.querySelector("#alias-creator-link-current") as HTMLButtonElement;

    this.setupCodeInput();
    this.setupLinkInput();
    this.setupForm();
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
    const validation = this.querySelector("#alias-creator-code-validation") as HTMLElement
    if (message) {
      this.codeInput?.setCustomValidity(message);
      validation.innerHTML = message;
    } else {
      this.codeInput?.setCustomValidity("");
      validation.innerHTML = "";
    }
  }

  //////////////////////////////////////////////////////////
  // Link Input Validation
  //////////////////////////////////////////////////////////

  private setupLinkInput = () => {
    this.linkInput?.addEventListener("input", this.linkOnChange);
    this.linkInput?.addEventListener("blur", this.linkOnBlur);
    this.linkCurrentButton?.addEventListener("click", this.setLinkToCurrent);
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
    const validation = this.querySelector("#alias-creator-link-validation") as HTMLElement
    if (message) {
      this.linkInput?.setCustomValidity(message);
      validation.innerHTML = message;
    } else {
      this.linkInput?.setCustomValidity("");
      validation.innerHTML = "";
    }
  }

  private setLinkToCurrent = () => {
    browser.tabs.query({ currentWindow: true, active: true })
      .then(tabs => {
        if (this.linkInput === undefined) {
          return;
        }
        this.linkInput.value = tabs[0].url ?? "";
        this.linkOnBlur();
      });
  }

  //////////////////////////////////////////////////////////
  // Submission Handling
  //////////////////////////////////////////////////////////

  private setupForm = () => {
    this.form?.addEventListener("submit", this.handleSubmit);
  }

  private handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!this.validateAlias()) {
      this.codeOnBlur();
      this.linkOnBlur();
      return;
    }
    const alias = this.createAlias();
    const result = await this.requestCreate(alias);
    if (result.type === ResponseType.ERROR) {
      this.setSubmitValidity(`Error: ${result.data.message}`);
      console.error(result.data.message);
      return;
    }
    this.resetInputs();
    this.dispatchCreate(alias);
  }

  private validateAlias = () => {
    return this.validateCode() && this.validateLink();
  }

  private createAlias = (): AliasCreate => {
    return {
      code: this.codeInput?.value.trim() ?? "",
      link: this.linkInput?.value.trim() ?? "",
      name: this.noteInput?.value.trim() ?? "",
    };
  }

  private requestCreate = async (alias: AliasCreate): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_CREATE,
      data: alias,
    });
  }

  private setSubmitValidity = (message?: string) => {
    const validation = this.querySelector("#alias-creator-submit-validation") as HTMLElement
    if (message) {
      validation.innerHTML = message;
    } else {
      validation.innerHTML = "";
    }
  }

  private resetInputs = () => {
    if (this.codeInput === undefined || this.linkInput === undefined || this.noteInput === undefined) {
      return;
    }
    this.codeInput.value = "";
    this.linkInput.value = "https://";
    this.noteInput.value = "";
    this.setCodeValidity();
    this.setLinkValidity();
    this.setSubmitValidity();
  }

  private dispatchCreate = (aliasCreate: AliasCreate) => {
    this.dispatchEvent(new CustomEvent("createalias", {
      detail: aliasCreate,
      bubbles: true,
    }));
  }
}