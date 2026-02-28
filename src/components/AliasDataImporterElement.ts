import type { Alias, AliasCreate } from "@alias/alias";
import {
  type IClientMessenger,
  RequestType,
  type ResponseMessage,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { html } from "lit";
import { customElement, state } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";
import { importIcon } from "./icons";

type AliasValidity = {
  alias: Alias;
  excluded: boolean;
  codeValidity?: string;
};

type ImportData = {
  summary: string;
  included: AliasValidity[];
  excluded: AliasValidity[];
  readyForImport: Alias[];
};

declare global {
  interface HTMLElementTagNameMap {
    [AliasDataImporterElement.ELEMENT_NAME]: AliasDataImporterElement;
  }
}

@customElement("alias-data-importer")
export class AliasDataImporterElement extends BaseElement {
  static readonly ELEMENT_NAME = "alias-data-importer";

  private messenger: IClientMessenger = BrowserClientMessenger;

  @state()
  private _data: ImportData | null = null;

  setData = async (filename: string, aliases: Alias[]) => {
    const response = await this.messenger.send({
      type: RequestType.ALIASES_GET,
    });
    if (response.type !== ResponseType.ALIASES_GET) {
      return;
    }
    const existing = response.data;
    const aliasValidity = this.mapAliasValidity(aliases, existing);

    const included = aliasValidity.filter(({ excluded }) => !excluded);
    const excluded = aliasValidity.filter(({ excluded }) => excluded);

    const plural = (count: number) => (count === 1 ? "" : "es");
    const summary = `${included.length} out of ${aliases.length} alias${plural(aliases.length)} can be imported from ${filename}.`;

    this._data = {
      summary,
      included,
      excluded,
      readyForImport: included.map(({ alias }) => alias),
    };
  };

  //////////////////////////////////////////////////////////
  // Alias Validation
  //////////////////////////////////////////////////////////

  private mapAliasValidity = (
    aliases: Alias[],
    existing: Alias[],
  ): AliasValidity[] => {
    const existingCodes = new Set(existing.map((a) => a.code));
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
        validity.codeValidity =
          "An alias with this code is already being imported.";
      }
      validities.push(validity);
      importedCodes.add(validity.alias.code);
    }

    return validities;
  };

  private validateAliasFields = (alias: Alias): boolean => {
    return this.validateCode(alias.code) && this.validateLink(alias.link);
  };

  private validateCode = (code: string) => {
    return code.length > 0;
  };

  private validateLink = (link: string) => {
    try {
      new URL(link);
      return true;
    } catch {
      return false;
    }
  };

  //////////////////////////////////////////////////////////
  // Included/Excluded Lists
  //////////////////////////////////////////////////////////

  private renderAliasListing = (validity: AliasValidity) => {
    const { alias, excluded, codeValidity } = validity;
    const classes = `less-hover ${excluded ? "negative" : "neutral"}`;
    return html`
      <li data-id=${alias.id} data-code=${alias.code}>
        <alias-manager
          class=${classes}
          alias-id=${alias.id}
          code=${alias.code}
          link=${alias.link}
          note=${alias.note}
          readonly
          readonly-code-validity=${codeValidity ?? ""}
        ></alias-manager>
      </li>
    `;
  };

  //////////////////////////////////////////////////////////
  // Import Button
  //////////////////////////////////////////////////////////

  private importAliases = () => {
    if (this._data === null) return;
    for (const alias of this._data.readyForImport) {
      // FIXME: no validation that the creates were successful
      this.requestCreate(alias);
    }
    this.dispatchSetPage("complete");
    setTimeout(() => window.close(), 2000);
  };

  private requestCreate = async (
    alias: AliasCreate,
  ): Promise<ResponseMessage> => {
    return await this.messenger.send({
      type: RequestType.ALIAS_CREATE,
      data: alias,
    });
  };

  private dispatchSetPage = (page: string) => {
    this.dispatchEvent(
      new CustomEvent("setpage", {
        detail: page,
        bubbles: true,
      }),
    );
  };

  //////////////////////////////////////////////////////////
  // Rendering
  //////////////////////////////////////////////////////////

  private renderExcluded(excluded: AliasValidity[]) {
    if (excluded.length === 0) return "";
    return html`
      <details id="import-excluded" class="negative">
        <summary>Excluded (${excluded.length})</summary>
        <ul>${excluded.map((v) => this.renderAliasListing(v))}</ul>
      </details>
    `;
  }

  private renderIncluded(included: AliasValidity[]) {
    if (included.length === 0) return "";
    return html`
      <details id="import-included" class="neutral" open>
        <summary>Included (${included.length})</summary>
        <ul>${included.map((v) => this.renderAliasListing(v))}</ul>
      </details>
    `;
  }

  override render() {
    const data = this._data;
    const canImport = data !== null && data.readyForImport.length > 0;
    return html`
      <button id="import-button" class="filled positive" ?disabled=${!canImport} @click=${this.importAliases}>
        ${importIcon}
        Import
      </button>
      <p id="import-summary">${data?.summary ?? ""}</p>
      ${data !== null ? this.renderExcluded(data.excluded) : ""}
      ${data !== null ? this.renderIncluded(data.included) : ""}
    `;
  }
}
