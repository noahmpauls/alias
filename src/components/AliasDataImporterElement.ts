import type { Alias, AliasCreate } from "@alias/alias";
import { RequestType, ResponseType, type IClientMessenger, type ResponseMessage } from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { AliasManagerElement } from "./AliasManagerElement";
import type { PageName } from "./AliasPagesElement";

const ALIAS_DATA_IMPORTER_NAME = "alias-data-importer";

type AliasValidity = {
  alias: Alias,
  excluded: boolean,
  codeValidity?: string,
}

export class AliasDataImporterElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_DATA_IMPORTER_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_DATA_IMPORTER_NAME)) {
      window.AliasDataImporterElement = AliasDataImporterElement;
      window.customElements.define(ALIAS_DATA_IMPORTER_NAME, AliasDataImporterElement);
    }
  }

  private messenger: IClientMessenger;
  private importButton: HTMLButtonElement | null = null;
  private importSummary: HTMLParagraphElement | null = null;
  private includedDetails: HTMLDetailsElement | null = null;
  private excludedDetails: HTMLDetailsElement | null = null;
  private readyForImport: Alias[] = [];

  constructor() {
    super();
    this.messenger = BrowserClientMessenger;
  }

  connectedCallback() {
    this.importButton = this.querySelector("#import-button");
    this.importSummary = this.querySelector("#import-summary");
    this.includedDetails = this.querySelector("#import-included");
    this.excludedDetails = this.querySelector("#import-excluded");

    this.setupImportButton();
  }

  setData = async (filename: string, aliases: Alias[]) => {
    const response = await this.messenger.send({ type: RequestType.ALIASES_GET });
    if (response.type !== ResponseType.ALIASES_GET) {
      return;
    }
    const existing = response.data;
    const aliasValidity = this.mapAliasValidity(aliases, existing);

    const includedAliases = aliasValidity
      .filter(({ excluded }) => !excluded);

    const excludedAliases = aliasValidity
      .filter(({ excluded }) => excluded);

    if (includedAliases.length > 0) {
      this.readyForImport = includedAliases.map(({ alias }) => alias);
      this.enableImportButton();
    }
  
    this.setImportSummary(filename, aliases.length, includedAliases.length);
    this.setIncludedDetails(includedAliases);
    this.setExcludedDetails(excludedAliases);        
  }

  //////////////////////////////////////////////////////////
  // Import Summary
  //////////////////////////////////////////////////////////

  private setImportSummary = (filename: string, total: number, importable: number) => {
    const plural = (count: number) => count === 1 ? "" : "es";
    const message = `${importable} out of ${total} alias${plural(total)} can be imported from ${filename}.`;
    if (this.importSummary) {
      this.importSummary.innerText = message;
    }
  }

  //////////////////////////////////////////////////////////
  // Included/Excluded Lists
  //////////////////////////////////////////////////////////

  private setIncludedDetails = (aliases: AliasValidity[]) => {
    if (aliases.length > 0) {
      const summary = this.includedDetails?.querySelector("summary");
      if (summary) {
        summary.innerText = `Included (${aliases.length})`;
      }
    } else {
      this.includedDetails?.remove();
    }

    for (const alias of aliases) {
      const listing = this.createAliasListing(alias);
      this.includedDetails?.querySelector("ul")?.appendChild(listing);
    }
  }

  private setExcludedDetails = (aliases: AliasValidity[]) => {
    if (aliases.length > 0) {
      const summary = this.excludedDetails?.querySelector("summary");
      if (summary) {
        summary.innerText = `Excluded (${aliases.length})`;
      }
      if (aliases.length === 0 && this.excludedDetails) {
        this.excludedDetails.open = true;
      }
    } else {
      this.excludedDetails?.remove();
    }

    for (const alias of aliases) {
      const listing = this.createAliasListing(alias);
      this.excludedDetails?.querySelector("ul")?.appendChild(listing);
    }
  }

  private createAliasListing = (validity: AliasValidity): HTMLElement => {
    const manager = this.createReadonlyAliasManager(validity);
    const container = document.createElement("li");
    container.dataset.id = validity.alias.id;
    container.dataset.code = validity.alias.code;
    container.appendChild(manager);
    return container;
  }

  private createReadonlyAliasManager = (validity: AliasValidity): AliasManagerElement => {
    const { alias, excluded, codeValidity } = validity;
    const template = AliasManagerElement.initializeTemplate(alias);
    const manager = document.createElement("alias-manager");
    manager.setAttribute("readonly", "true");
    manager.classList.add("less-hover");
    if (excluded) {
      manager.classList.add("negative");
      if (codeValidity) {
        manager.setAttribute("readonly-code-validity", codeValidity);
      }
    } else {
      manager.classList.add("neutral");
    }
    manager.replaceChildren(template);
    manager.dataset.id = alias.id;
    manager.dataset.code = alias.code;
    manager.dataset.link = alias.link;
    manager.dataset.note = alias.note;
    return manager;
  }

  //////////////////////////////////////////////////////////
  // Alias Validation
  //////////////////////////////////////////////////////////

  private mapAliasValidity = (aliases: Alias[], existing: Alias[]): AliasValidity[] => {
    const existingCodes = new Set(existing.map(a => a.code));
    const importedCodes = new Set();
    const validities: AliasValidity[] = [];

    for (const alias of aliases) {
      const validity: AliasValidity = {
        alias,
        excluded: false,
      };
      // alias fields are valid
      if (!this.validateAliasFields(alias)) {
        validity.excluded = true;
      // alias doesn't exist
      } else if (existingCodes.has(alias.code)) {
        validity.excluded = true;
        validity.codeValidity = "An alias with this code already exists.";
      // alias isn't already being imported
      } else if (importedCodes.has(alias.code)) {
        validity.excluded = true;
        validity.codeValidity = "An alias with this code is already being imported.";
      }
      validities.push(validity);
      importedCodes.add(validity.alias.code);
    }

    return validities;
  }

  private validateAliasFields = (alias: Alias): boolean => {
    return this.validateCode(alias.code) && this.validateLink(alias.link);
  }

  private validateCode = (code: string) => {
    return code.length > 0;
  }

  private validateLink = (link: string) => {
    try {
      const url = new URL(link);
      return true;
    } catch {
      return false;
    }
  }

  //////////////////////////////////////////////////////////
  // Import Button
  //////////////////////////////////////////////////////////

  private setupImportButton = () => {
    this.importButton?.addEventListener("click", this.importAliases);
  }

  private importAliases = () => {
    for (const alias of this.readyForImport) {
      // FIXME: no validation that the creates were successful
      this.requestCreate(alias);
    }
    this.dispatchSetPage("complete");
    setTimeout(() => window.close(), 2000);
  }

  private enableImportButton = () => {
    if (this.importButton !== null) {
      this.importButton.disabled = false;
    }
  }

  private requestCreate = async (alias: AliasCreate): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_CREATE,
      data: alias,
    });
  }

  private dispatchSetPage = (page: PageName) => {
    this.dispatchEvent(new CustomEvent("setpage", {
      detail: page,
      bubbles: true,
    }));
  }
}
