import type { AliasCreate } from "@alias/alias";
import { browser } from "@alias/browser";
import {
  type IClientMessenger,
  RequestType,
  type ResponseMessage,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";
import { plusIcon } from "./icons";

declare global {
  interface HTMLElementTagNameMap {
    [LitAliasCreatorElement.ELEMENT_NAME]: LitAliasCreatorElement;
  }
}

@customElement("lit-alias-creator")
export class LitAliasCreatorElement extends BaseElement {
  static readonly ELEMENT_NAME = "lit-alias-creator";

  private messenger: IClientMessenger = BrowserClientMessenger;

  @query("#alias-creator-code")
  private codeInput: HTMLInputElement | undefined;

  @query("#alias-creator-link")
  private linkInput: HTMLInputElement | undefined;

  @query("#alias-creator-note")
  private noteInput: HTMLInputElement | undefined;

  @state()
  private _codeValidation: string = "";

  @state()
  private _linkValidation: string = "";

  @state()
  private _submitValidation: string = "";

  override connectedCallback() {
    super.connectedCallback();
    this.setLinkToCurrent();
  }

  //////////////////////////////////////////////////////////
  // Code Input Validation
  //////////////////////////////////////////////////////////

  private codeOnChange = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      return;
    }

    if (this.codeInput?.value === "") {
      this.setCodeValidity("Must provide an alias.");
    }
  };

  private codeOnBlur = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      return;
    }

    if (this.codeInput) {
      this.codeInput.value = "";
    }
    this.setCodeValidity("Must provide an alias.");
  };

  private validateCode = () => {
    if (this.codeInput === undefined) return false;
    return this.codeInput.value.trim() !== "";
  };

  private setCodeValidity = (message?: string) => {
    if (this.codeInput === undefined) return;
    if (message) {
      this.codeInput.setCustomValidity(message);
      this._codeValidation = message;
    } else {
      this.codeInput.setCustomValidity("");
      this._codeValidation = "";
    }
  };

  //////////////////////////////////////////////////////////
  // Link Input Validation
  //////////////////////////////////////////////////////////

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

    if (this.linkInput && this.linkInput.value.trim() === "") {
      this.linkInput.value = "https://";
    }
    this.setLinkValidity("Must provide a valid link.");
  };

  private validateLink = () => {
    if (this.linkInput === undefined) return false;
    return this.tryCreateUrl(this.linkInput.value.trim()) !== undefined;
  };

  private tryCreateUrl(link: string): URL | undefined {
    try {
      return new URL(link);
    } catch {
      return undefined;
    }
  }

  private setLinkValidity = (message?: string) => {
    if (this.linkInput === undefined) return;
    if (message) {
      this.linkInput.setCustomValidity(message);
      this._linkValidation = message;
    } else {
      this.linkInput.setCustomValidity("");
      this._linkValidation = "";
    }
  };

  private setLinkToCurrent = () => {
    browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
      if (this.linkInput === undefined) return;
      const url = tabs[0].url ?? "";
      const isValid = this.tryCreateUrl(url) !== undefined;
      if (isValid) {
        this.linkInput.value = url;
        this.linkOnBlur();
      }
    });
  };

  //////////////////////////////////////////////////////////
  // Submission Handling
  //////////////////////////////////////////////////////////

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
    return {
      code: this.codeInput?.value.trim() ?? "",
      link: this.linkInput?.value.trim() ?? "",
      note: this.noteInput?.value.trim() ?? "",
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
    this._submitValidation = message ?? "";
  };

  private resetInputs = () => {
    if (this.codeInput) this.codeInput.value = "";
    if (this.linkInput) this.linkInput.value = "https://";
    if (this.noteInput) this.noteInput.value = "";
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

  private dispatchSetPage = (page: string) => {
    this.dispatchEvent(
      new CustomEvent("setpage", {
        detail: page,
        bubbles: true,
      }),
    );
  };

  override render() {
    return html`
      <form id="alias-creator-form" class="input-container" @submit=${this.handleSubmit}>
        <div>
          <label for="alias-creator-code">Code:</label>
          <input name="code" id="alias-creator-code" type="text" style="font-weight: bold; font-family: monospace;"
            @input=${this.codeOnChange} @blur=${this.codeOnBlur}>
          <span id="alias-creator-code-validation" class="offset validation-error">${this._codeValidation}</span>
        </div>
        <div>
          <label for="alias-creator-link">Link:</label>
          <input name="link" id="alias-creator-link" type="text" value="https://"
            @input=${this.linkOnChange} @blur=${this.linkOnBlur}>
          <span id="alias-creator-link-validation" class="offset validation-error">${this._linkValidation}</span>
        </div>
        <div>
          <label for="alias-creator-note">Note:</label>
          <input name="notes" id="alias-creator-note" type="text">
        </div>
        <div>
          <button id="alias-creator-submit" class="offset filled positive" type="submit">
            ${plusIcon}
            Create
          </button>
          <span id="alias-creator-submit-validation" class="offset validation-error">${this._submitValidation}</span>
        </div>
      </form>
    `;
  }
}
