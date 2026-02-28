import type { AliasExternal } from "@alias/alias";
import { browser } from "@alias/browser";
import {
  type ErrorResponse,
  type IClientMessenger,
  RequestType,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { html } from "lit";
import { customElement } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";

declare global {
  interface HTMLElementTagNameMap {
    [LitAliasDataElement.ELEMENT_NAME]: LitAliasDataElement;
  }
}

@customElement("lit-alias-data")
export class LitAliasDataElement extends BaseElement {
  static readonly ELEMENT_NAME = "lit-alias-data";

  private messenger: IClientMessenger = BrowserClientMessenger;

  //////////////////////////////////////////////////////////
  // Export Button
  //////////////////////////////////////////////////////////

  private exportAliasData = async () => {
    const aliases = await this.getAliases();
    const dataString = this.toDataString(aliases);
    const tempAnchor = document.createElement("a");
    tempAnchor.setAttribute("href", dataString);
    tempAnchor.setAttribute("download", "aliases.json");
    document.body.appendChild(tempAnchor);
    tempAnchor.click();
    tempAnchor.remove();
  };

  private getAliases = async (): Promise<AliasExternal[]> => {
    const response = await this.messenger.send({
      type: RequestType.ALIASES_GET,
    });
    if (response.type !== ResponseType.ALIASES_GET) {
      // TODO: still feels wrong to use the types this way.
      console.error(
        `error getting aliases: ${(response as ErrorResponse).data.message}`,
      );
      return [];
    }
    return response.data.map((a) => {
      const result: AliasExternal = {
        code: a.code,
        link: a.link,
      };
      if (a.note.length > 0) {
        result.note = a.note;
      }
      return result;
    });
  };

  private toDataString = (aliases: AliasExternal[]): string => {
    const json = JSON.stringify(aliases, null, 2);
    return `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;
  };

  //////////////////////////////////////////////////////////
  // Import Button
  //////////////////////////////////////////////////////////

  private openImportWindow = () => {
    browser.windows.create({
      url: "/ui/import.html",
      type: "panel",
      width: 480,
      height: 540,
    });
  };

  override render() {
    return html`
      <div class="h-stack center">
        <button id="export" class="filled neutral" @click=${this.exportAliasData}>
          <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Export Aliases
        </button>
        <button id="import" class="filled neutral" @click=${this.openImportWindow}>
          <svg class="icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Import Aliases
        </button>
      </div>
    `;
  }
}
