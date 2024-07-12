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

    this.form?.addEventListener("submit", this.handleSubmit);
    this.linkCurrentButton?.addEventListener("click", this.setLinkToCurrent);
  }

  private handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    const alias = this.createAlias();
    const result = await this.requestAliasCreation(alias);
    if (result.type === ResponseType.ERROR) {
      console.error(result.data.message);
      return;
    }
    this.resetInputs();
    this.dispatchCreate(alias);
  }

  private dispatchCreate = (aliasCreate: AliasCreate) => {
    this.dispatchEvent(new CustomEvent("createalias", {
      detail: aliasCreate,
      bubbles: true,
    }));
  }

  private createAlias = (): AliasCreate => {
    return {
      code: this.codeInput?.value.trim() ?? "",
      link: this.linkInput?.value.trim() ?? "",
      name: this.noteInput?.value.trim() ?? "",
    };
  }

  private requestAliasCreation = async (alias: AliasCreate): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_CREATE,
      data: alias,
    });
  }

  private resetInputs = () => {
    if (this.codeInput === undefined || this.linkInput === undefined || this.noteInput === undefined) {
      return;
    }
    this.codeInput.value = "";
    this.linkInput.value = "https://";
    this.noteInput.value = "";
  }

  private setLinkToCurrent = () => {
    browser.tabs.query({ currentWindow: true, active: true })
      .then(tabs => {
        if (this.linkInput === undefined) {
          return;
        }
        this.linkInput.value = tabs[0].url ?? "";
      });
  }
}