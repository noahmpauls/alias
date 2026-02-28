import type { AliasCreate } from "@alias/alias";
import { browser } from "@alias/browser";
import {
  type IClientMessenger,
  RequestType,
  type ResponseMessage,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import type { PageName } from "./AliasPagesElement";

const ALIAS_CREATOR_NAME = "alias-creator";

declare global {
  interface Window {
    AliasCreatorElement: typeof AliasCreatorElement;
  }
  interface HTMLElementTagNameMap {
    [ALIAS_CREATOR_NAME]: AliasCreatorElement;
  }
}

type ConnectedState = {
  form: HTMLFormElement;
  codeInput: HTMLInputElement;
  linkInput: HTMLInputElement;
  noteInput: HTMLInputElement;
};

export class AliasCreatorElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_CREATOR_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_CREATOR_NAME)) {
      window.AliasCreatorElement = AliasCreatorElement;
      window.customElements.define(ALIAS_CREATOR_NAME, AliasCreatorElement);
    }
  };

  private messenger: IClientMessenger;
  private state: ConnectedState | undefined = undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    const form = this.querySelector<HTMLFormElement>("#alias-creator-form");
    const codeInput = this.querySelector<HTMLInputElement>(
      "#alias-creator-code",
    );
    const linkInput = this.querySelector<HTMLInputElement>(
      "#alias-creator-link",
    );
    const noteInput = this.querySelector<HTMLInputElement>(
      "#alias-creator-note",
    );

    if (!form || !codeInput || !linkInput || !noteInput) {
      return;
    }

    this.state = { form, codeInput, linkInput, noteInput };

    this.setupCodeInput();
    this.setupLinkInput();
    this.setupForm();
  }

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
      "#alias-creator-code-validation",
    ) as HTMLElement;
    if (message) {
      this.state.codeInput.setCustomValidity(message);
      validation.innerText = message;
    } else {
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
      "#alias-creator-link-validation",
    ) as HTMLElement;
    if (message) {
      this.state.linkInput.setCustomValidity(message);
      validation.innerText = message;
    } else {
      this.state.linkInput.setCustomValidity("");
      validation.innerText = "";
    }
  };

  private setLinkToCurrent = () => {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
      if (this.state === undefined) return;
      const url = tabs[0].url ?? "";
      const isValid = this.tryCreateUrl(url) !== undefined;
      if (isValid) {
        this.state.linkInput.value = url;
        this.linkOnBlur();
      }
    });
  };

  //////////////////////////////////////////////////////////
  // Submission Handling
  //////////////////////////////////////////////////////////

  private setupForm = () => {
    if (this.state === undefined) return;
    this.state.form.addEventListener("submit", this.handleSubmit);
    this.setLinkToCurrent();
  };

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
  };

  private validateAlias = () => {
    return this.validateCode() && this.validateLink();
  };

  private createAlias = (): AliasCreate => {
    if (this.state === undefined) return { code: "", link: "", note: "" };
    return {
      code: this.state.codeInput.value.trim(),
      link: this.state.linkInput.value.trim(),
      note: this.state.noteInput.value.trim(),
    };
  };

  private requestCreate = async (
    alias: AliasCreate,
  ): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_CREATE,
      data: alias,
    });
  };

  private setSubmitValidity = (message?: string) => {
    const validation = this.querySelector(
      "#alias-creator-submit-validation",
    ) as HTMLElement;
    if (message) {
      validation.innerText = message;
    } else {
      validation.innerText = "";
    }
  };

  private resetInputs = () => {
    if (this.state === undefined) return;
    this.state.codeInput.value = "";
    this.state.linkInput.value = "https://";
    this.state.noteInput.value = "";
    this.setCodeValidity();
    this.setLinkValidity();
    this.setSubmitValidity();
  };

  private dispatchCreate = (aliasCreate: AliasCreate) => {
    this.dispatchEvent(
      new CustomEvent("createalias", {
        detail: aliasCreate,
        bubbles: true,
      }),
    );
  };

  private dispatchSetPage = (page: PageName) => {
    this.dispatchEvent(
      new CustomEvent("setpage", {
        detail: page,
        bubbles: true,
      }),
    );
  };
}
