import type { Alias, AliasDelete, AliasUpdate } from "@alias/alias";
import {
  type IClientMessenger,
  RequestType,
  type ResponseMessage,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";
import { editIcon, linkIcon, saveIcon, terminalIcon, trashIcon } from "./icons";

declare global {
  interface HTMLElementTagNameMap {
    [AliasManagerElement.ELEMENT_NAME]: AliasManagerElement;
  }
}

@customElement("alias-manager")
export class AliasManagerElement extends BaseElement {
  static readonly ELEMENT_NAME = "alias-manager";

  private messenger: IClientMessenger = BrowserClientMessenger;

  @property({ type: String, reflect: true, attribute: "alias-id" })
  aliasId: string = "";

  @property({ type: String, reflect: true })
  code: string = "";

  @property({ type: String, reflect: true })
  link: string = "";

  @property({ type: String, reflect: true })
  note: string = "";

  @property({ type: Boolean, reflect: true })
  readonly: boolean = false;

  @property({ type: String, attribute: "readonly-code-validity" })
  readonlyCodeValidity: string = "";

  private get codeInput(): HTMLInputElement | undefined {
    return (
      this.querySelector<HTMLInputElement>(`#code-input-${this.aliasId}`) ??
      undefined
    );
  }

  private get linkInput(): HTMLInputElement | undefined {
    return (
      this.querySelector<HTMLInputElement>(`#link-input-${this.aliasId}`) ??
      undefined
    );
  }

  private get noteInput(): HTMLInputElement | undefined {
    return (
      this.querySelector<HTMLInputElement>(`#note-input-${this.aliasId}`) ??
      undefined
    );
  }

  @state()
  private _codeValidation: string = "";

  @state()
  private _linkValidation: string = "";

  @state()
  private _submitValidation: string = "";

  @state()
  private _changed: boolean = false;

  override firstUpdated() {
    if (this.readonly) {
      this.initReadonly();
    }
  }

  private initReadonly() {
    this.codeOnChange();
    if (this.readonlyCodeValidity) {
      this.setCodeValidity(this.readonlyCodeValidity);
    }
    this.linkOnChange();
  }

  //////////////////////////////////////////////////////////
  // Delete Button
  //////////////////////////////////////////////////////////

  private handleDelete = async () => {
    const aliasDelete: AliasDelete = { id: this.aliasId };
    const response = await this.requestDelete(aliasDelete);
    if (response.type === ResponseType.ALIAS_DELETE) {
      const deletedAlias = response.data;
      this.dispatchDelete(deletedAlias);
    }
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

  //////////////////////////////////////////////////////////
  // Code Input Validation
  //////////////////////////////////////////////////////////

  private codeOnChange = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      this.updateChanged();
      return;
    }

    if (this.codeInput?.value === "") {
      this.setCodeValidity("Must provide an alias.");
    }
    this.updateChanged();
  };

  private codeOnBlur = () => {
    if (this.validateCode()) {
      this.setCodeValidity();
      this.updateChanged();
      return;
    }

    if (this.codeInput) {
      this.codeInput.value = "";
    }
    this.setCodeValidity("Must provide an alias.");
    this.updateChanged();
  };

  private validateCode = () => {
    if (this.codeInput === undefined) return false;
    return this.codeInput.value.trim() !== "";
  };

  private setCodeValidity = (message?: string) => {
    if (this.codeInput === undefined) return;
    if (message) {
      this.codeInput.classList.add("invalid");
      this.codeInput.setCustomValidity(message);
      this._codeValidation = message;
    } else {
      this.codeInput.classList.remove("invalid");
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
      this.updateChanged();
      return;
    }
    this.setLinkValidity("Must provide a valid link.");
    this.updateChanged();
  };

  private linkOnBlur = () => {
    if (this.validateLink()) {
      this.setLinkValidity();
      this.updateChanged();
      return;
    }

    if (this.linkInput && this.linkInput.value.trim() === "") {
      this.linkInput.value = "https://";
    }
    this.setLinkValidity("Must provide a valid link.");
    this.updateChanged();
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
      this.linkInput.classList.add("invalid");
      this.linkInput.setCustomValidity(message);
      this._linkValidation = message;
    } else {
      this.linkInput.classList.remove("invalid");
      this.linkInput.setCustomValidity("");
      this._linkValidation = "";
    }
  };

  //////////////////////////////////////////////////////////
  // Note Input Validation
  //////////////////////////////////////////////////////////

  private noteOnChange = () => {
    this.updateChanged();
  };

  //////////////////////////////////////////////////////////
  // Submission Handling
  //////////////////////////////////////////////////////////

  private handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (this.readonly) return;
    if (!this.validateAlias()) {
      this.codeOnBlur();
      this.linkOnBlur();
      return;
    }
    const aliasUpdate = this.createAliasUpdate();
    const response = await this.sendUpdate(aliasUpdate);
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
    return {
      id: this.aliasId,
      code: this.codeInput?.value.trim() ?? "",
      link: this.linkInput?.value.trim() ?? "",
      note: this.noteInput?.value.trim() ?? "",
    };
  };

  private sendUpdate = async (
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
    this._submitValidation = message ?? "";
  };

  private updateChanged = () => {
    if (
      this.codeInput === undefined ||
      this.linkInput === undefined ||
      this.noteInput === undefined
    ) {
      this._changed = false;
      return;
    }
    const codeUpdated = this.codeInput.value !== this.code;
    const linkUpdated = this.linkInput.value !== this.link;
    const noteUpdated = this.noteInput.value !== this.note;
    this._changed = codeUpdated || linkUpdated || noteUpdated;
    // FIXME: this doesn't seem very idiomatic in Lit...
    if (this._changed) {
      this.classList.add("changed");
    } else {
      this.classList.remove("changed");
    }
  };

  //////////////////////////////////////////////////////////
  // Rendering
  //////////////////////////////////////////////////////////

  private renderDeleteButton() {
    if (this.readonly) return "";
    return html`
      <button id="delete-button-${this.aliasId}" class="icon subtle negative" type="button" @click=${this.handleDelete}>
        ${trashIcon}
      </button>
    `;
  }

  private renderSubmitButton() {
    if (this.readonly || !this._changed) return "";
    return html`
      <button id="submit-button-${this.aliasId}" type="submit" class="offset icon filled neutral">
        ${saveIcon}
        Save
      </button>
      <span id="submit-validation-${this.aliasId}" class="offset validation-error">${this._submitValidation}</span>
    `;
  }

  override render() {
    const id = this.aliasId;
    return html`
      <form id="alias-manager-${id}" class="input-container" @submit=${this.handleSubmit}>
        <div>
          <label for="code-input-${id}" title="Code">
            ${terminalIcon}
            ${" "}
          </label>
          <div class="grow-first">
            <h2>
              <input class="subtle" id="code-input-${id}" aria-label="Alias" type="text"
                .value=${this.code} ?disabled=${this.readonly}
                @input=${this.codeOnChange} @blur=${this.codeOnBlur}>
            </h2>
            ${this.renderDeleteButton()}
          </div>
          <span id="code-validation-${id}" class="offset validation-error">${this._codeValidation}</span>
        </div>
        <div>
          <label for="link-input-${id}" title="Link" class="subdued">
            ${linkIcon}
          </label>
          <input class="subtle" id="link-input-${id}" aria-label="Link" type="text"
            .value=${this.link} ?disabled=${this.readonly}
            @input=${this.linkOnChange} @blur=${this.linkOnBlur}>
          <span id="link-validation-${id}" class="offset validation-error">${this._linkValidation}</span>
        </div>
        <div>
          <label for="note-input-${id}" title="Note" class="subdued">
            ${editIcon}
          </label>
          <input class="subtle" id="note-input-${id}" aria-label="Note" type="text"
            @input=${this.noteOnChange} .value=${this.note} ?disabled=${this.readonly}>
        </div>
        <div>
          ${this.renderSubmitButton()}
        </div>
      </form>
    `;
  }
}
