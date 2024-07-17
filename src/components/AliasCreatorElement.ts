import type { AliasCreate } from "@alias/alias";
import { browser } from "@alias/browser";
import { RequestType, ResponseType, type IClientMessenger, type ResponseMessage } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import type { PageName } from "./AliasPagesElement";

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
      validation.innerText = message;
    } else {
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
    const validation = this.querySelector("#alias-creator-link-validation") as HTMLElement
    if (message) {
      this.linkInput?.setCustomValidity(message);
      validation.innerText = message;
    } else {
      this.linkInput?.setCustomValidity("");
      validation.innerText = "";
    }
  }

  private setLinkToCurrent = () => {
    browser.tabs.query({ currentWindow: true, active: true })
      .then(tabs => {
        if (this.linkInput === undefined) {
          return;
        }
        const url = tabs[0].url ?? "";
        const isValid = this.tryCreateUrl(url) !== undefined;
        if (isValid) {
          this.linkInput.value = url;
          this.linkOnBlur();
        }
      });
  }

  //////////////////////////////////////////////////////////
  // Submission Handling
  //////////////////////////////////////////////////////////

  private setupForm = () => {
    this.form?.addEventListener("submit", this.handleSubmit);
    this.setLinkToCurrent();
  }

  private handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!this.validateAlias()) {
      this.codeOnBlur();
      this.linkOnBlur();
      return;
    }
    const alias = this.createAlias();
    const response = await this.requestCreate(alias);
    if (response.type === ResponseType.ERROR) {
      this.setSubmitValidity(`Error: ${response.data.message}`);
      console.error(response.data.message);
      return;
    }
    this.resetInputs();
    // TODO: this feels wrong; should be able to narrow down to either error or
    // alias_create via types
    if (response.type === ResponseType.ALIAS_CREATE) {
      const newAlias = response.data;
      this.dispatchCreate(newAlias);
      this.dispatchSetPage("manage");
    }
  }

  private validateAlias = () => {
    return this.validateCode() && this.validateLink();
  }

  private createAlias = (): AliasCreate => {
    return {
      code: this.codeInput?.value.trim() ?? "",
      link: this.linkInput?.value.trim() ?? "",
      note: this.noteInput?.value.trim() ?? "",
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
      validation.innerText = message;
    } else {
      validation.innerText = "";
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

  private dispatchSetPage = (page: PageName) => {
    this.dispatchEvent(new CustomEvent("setpage", {
      detail: page,
      bubbles: true,
    }));
  }
}