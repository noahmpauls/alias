import type { Alias } from "@alias/alias";
import type { PageName } from "./AliasPagesElement";

const ALIAS_FILE_IMPORTER_NAME = "alias-file-importer";

export class AliasFileImporterElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_FILE_IMPORTER_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_FILE_IMPORTER_NAME)) {
      window.AliasFileImporterElement = AliasFileImporterElement;
      window.customElements.define(ALIAS_FILE_IMPORTER_NAME, AliasFileImporterElement);
    }
  }

  private fileInput: HTMLInputElement | null = null;
  private errorBox: HTMLDivElement | null = null;

  constructor() {
    super();
  }

  connectedCallback() {
    this.fileInput = this.querySelector<HTMLInputElement>("#file-input");
    this.errorBox = this.querySelector<HTMLDivElement>("#file-error");

    this.setupFileInput();
  }

  private setupFileInput = () => {
    this.fileInput?.addEventListener("change", this.handleFileSelect);
  }

  private handleFileSelect = () => {
    const files = (this.fileInput?.files ?? []);
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
  }

  //////////////////////////////////////////////////////////
  // File Parsing
  //////////////////////////////////////////////////////////

  private parseFileContent = (filename: string, content: string): Alias[] | undefined => {
    const jsonResult = this.parseJson(content);
    if (!jsonResult.success) {
      this.showErrorBox(`${filename}: Error parsing JSON`, jsonResult.error);
      return undefined;
    }
    const json = jsonResult.json;
    const array = this.parseArray(json);
    if (array === undefined) {
      this.showErrorBox(`${filename}: Error reading JSON`, "Expected imported JSON to be an array.");
      return undefined;
    }
    const aliases = this.parseAliases(array);
    if (aliases.length === 0) {
      this.showErrorBox(`${filename}: Error reading aliases`, "Imported JSON array does not contain any alias objects.");
      return undefined;
    }
    this.hideErrorBox();
    return aliases;
  }

  private parseJson = (content: string): { success: true, json: any } | { success: false, error: string }  => {
    try {
      const json = JSON.parse(content);
      return { success: true, json };
    } catch (e) {
      const error = e as Error;
      const message = error.message.substring("JSON.parse: ".length);
      const capitalizedMessage = message[0].toLocaleUpperCase() + message.substring(1);
      return { success: false, error: capitalizedMessage };
    }
  }

  private parseArray = (json: any): any[] | undefined => {
    if (Array.isArray(json)) {
      return json;
    } else {
      return undefined;
    }
  }

  private parseAliases = (array: any[]): Alias[] => {
    const aliases: Alias[] = array.map((elem, i) => {
      const code = elem.code;
      if (typeof code !== "string") {
        return undefined;
      }
      const link = elem.link;
      if (typeof link !== "string") {
        return undefined;
      }
      let note = elem.note;
      if (typeof note !== "string") {
        note = "";
      }
      const alias: Alias = {
        id: String(i), code, link, note
      }
      return alias;
    }).filter(a => a !== undefined);
    return aliases;
  }

  //////////////////////////////////////////////////////////
  // Error Box
  //////////////////////////////////////////////////////////

  private showErrorBox = (main: string, detail?: string) => {
    if (this.errorBox === null) {
      return;
    }
    this.setErrorBoxMain(main);
    this.setErrorBoxDetail(detail);
    this.errorBox.style.display = "";
  }

  private setErrorBoxMain = (message: string) => {
    const main = this.errorBox?.querySelector<HTMLParagraphElement>("#file-error-main");
    if (!main) {
      return;
    }
    main.innerText = message;
  }

  private setErrorBoxDetail = (message: string = "") => {
    const detail = this.errorBox?.querySelector<HTMLParagraphElement>("#file-error-detail");
    if (!detail) {
      return;
    }
    detail.innerText = message;
    detail.style.display = message === "" ? "none" : "";
  }

  private hideErrorBox = () => {
    if (this.errorBox === null) {
      return;
    }
    this.errorBox.style.display = "none";
  }

  //////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////

  private dispatchExtractAliases = (filename: string, aliases: Alias[]) => {
    this.dispatchEvent(new CustomEvent("extractaliasdata", {
      detail: { filename, aliases },
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
