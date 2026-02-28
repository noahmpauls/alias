import type { Alias } from "@alias/alias";
import { html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";
import { fileIcon } from "./icons";

type FileError = {
  main: string;
  detail: string;
};

declare global {
  interface HTMLElementTagNameMap {
    [AliasFileImporterElement.ELEMENT_NAME]: AliasFileImporterElement;
  }
}

@customElement("alias-file-importer")
export class AliasFileImporterElement extends BaseElement {
  static readonly ELEMENT_NAME = "alias-file-importer";

  @state()
  private _error: FileError | null = null;

  @query("#file-input")
  private fileInput: HTMLInputElement | undefined;

  override connectedCallback() {
    super.connectedCallback();
  }

  //////////////////////////////////////////////////////////
  // File Parsing
  //////////////////////////////////////////////////////////

  private handleFileSelect = () => {
    const files = this.fileInput?.files ?? [];
    if (files.length === 0) {
      return;
    }
    const file = files[0];
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const aliases = this.parseFileContent(file.name, reader.result as string);
      if (aliases === undefined) {
        return;
      }
      this.dispatchExtractAliases(file.name, aliases);
      this.dispatchSetPage("data");
    });
    reader.readAsText(file);
  };

  private parseFileContent = (
    filename: string,
    content: string,
  ): Alias[] | undefined => {
    const jsonResult = this.parseJson(content);
    if (!jsonResult.success) {
      this.showErrorBox(`${filename}: Error parsing JSON`, jsonResult.error);
      return undefined;
    }
    const json = jsonResult.json;
    const array = this.parseArray(json);
    if (array === undefined) {
      this.showErrorBox(
        `${filename}: Error reading JSON`,
        "Expected imported JSON to be an array.",
      );
      return undefined;
    }
    const aliases = this.parseAliases(array);
    if (aliases.length === 0) {
      this.showErrorBox(
        `${filename}: Error reading aliases`,
        "Imported JSON array does not contain any alias objects.",
      );
      return undefined;
    }
    this.hideErrorBox();
    return aliases;
  };

  private parseJson = (
    content: string,
  ): { success: true; json: unknown } | { success: false; error: string } => {
    try {
      const json = JSON.parse(content);
      return { success: true, json };
    } catch (e) {
      const error = e as Error;
      const message = error.message.substring("JSON.parse: ".length);
      const capitalizedMessage =
        message[0].toLocaleUpperCase() + message.substring(1);
      return { success: false, error: capitalizedMessage };
    }
  };

  private parseArray = (json: unknown): unknown[] | undefined => {
    if (Array.isArray(json)) {
      return json;
    } else {
      return undefined;
    }
  };

  private parseAliases = (array: unknown[]): Alias[] => {
    return array
      .map((elem, i) => this.parseAlias(elem, i))
      .filter((a) => a !== undefined);
  };

  private parseAlias = (object: unknown, i: number): Alias | undefined => {
    if (typeof object !== "object" || object === null) {
      return undefined;
    }
    const elem = object as Record<string, unknown>;
    const code = elem.code;
    if (typeof code !== "string") {
      return undefined;
    }
    const link = elem.link;
    if (typeof link !== "string") {
      return undefined;
    }
    const note = typeof elem.note === "string" ? elem.note : "";
    return { id: String(i), code, link, note };
  };

  //////////////////////////////////////////////////////////
  // Error Box
  //////////////////////////////////////////////////////////

  private showErrorBox = (main: string, detail: string) => {
    this._error = { main, detail };
  };

  private hideErrorBox = () => {
    this._error = null;
  };

  //////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////

  private dispatchExtractAliases = (filename: string, aliases: Alias[]) => {
    this.dispatchEvent(
      new CustomEvent("extractaliasdata", {
        detail: { filename, aliases },
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

  private renderError() {
    if (this._error === null) return "";
    return html`
      <div id="file-error" class="flex-stack center" style="--g: 0.5rem;">
        <p id="file-error-main">${this._error.main}</p>
        <p id="file-error-detail">${this._error.detail}</p>
      </div>
    `;
  }

  override render() {
    return html`
      <div class="center-col flex-stack" style="--g: 2rem;">
        <div class="flex-stack center" style="--g: 0.5rem;">
          <label id="file-button" class="button neutral filled" for="file-input">
            ${fileIcon}
            Select File
          </label>
          <input id="file-input" type="file" style="display: none;" @change=${this.handleFileSelect}>
          <!-- TODO: enable drag and drop -->
          <!--<p style="text-align: center;">Or drag and drop a file anywhere.</p>-->
        </div>
        ${this.renderError()}
      </div>
    `;
  }
}
