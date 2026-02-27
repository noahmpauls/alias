import type { AliasExternal } from "@alias/alias";
import { browser } from "@alias/browser";
import {
  type ErrorResponse,
  type IClientMessenger,
  RequestType,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";

const ALIAS_DATA_NAME = "alias-data";

type ConnectedState = {
  exportButton: HTMLButtonElement;
  importButton: HTMLButtonElement;
};

export class AliasDataElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_DATA_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_DATA_NAME)) {
      window.AliasDataElement = AliasDataElement;
      window.customElements.define(ALIAS_DATA_NAME, AliasDataElement);
    }
  };

  private messenger: IClientMessenger;
  private state: ConnectedState | undefined = undefined;

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    const exportButton = this.querySelector<HTMLButtonElement>("#export");
    const importButton = this.querySelector<HTMLButtonElement>("#import");

    if (!exportButton || !importButton) {
      return;
    }

    this.state = { exportButton, importButton };

    this.setupExportButton();
    this.setupImportButton();
  }

  //////////////////////////////////////////////////////////
  // Export Button
  //////////////////////////////////////////////////////////

  private setupExportButton = () => {
    if (this.state === undefined) return;
    this.state.exportButton.addEventListener("click", this.exportAliasData);
  };

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
    const externalAliases = response.data.map((a) => {
      const result: AliasExternal = {
        code: a.code,
        link: a.link,
      };
      if (a.note.length > 0) {
        result.note = a.note;
      }
      return result;
    });
    return externalAliases;
  };

  private toDataString = (aliases: AliasExternal[]): string => {
    const json = JSON.stringify(aliases, null, 2);
    return `data:text/json;charset=utf-8,${encodeURIComponent(json)}`;
  };

  //////////////////////////////////////////////////////////
  // Import Button
  //////////////////////////////////////////////////////////

  private setupImportButton = () => {
    if (this.state === undefined) return;
    this.state.importButton.addEventListener("click", this.openImportWindow);
  };

  private openImportWindow = () => {
    browser.windows.create({
      url: "/ui/import.html",
      type: "panel",
      width: 480,
      height: 540,
    });
  };
}
