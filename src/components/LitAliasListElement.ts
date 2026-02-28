import type { Alias } from "@alias/alias";
import {
  type IClientMessenger,
  RequestType,
  ResponseType,
} from "@alias/message";
import { BrowserClientMessenger } from "@alias/message/browser";
import { html } from "lit";
import { customElement, query, state } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";

declare global {
  interface HTMLElementTagNameMap {
    [LitAliasListElement.ELEMENT_NAME]: LitAliasListElement;
  }
}

@customElement("lit-alias-list")
export class LitAliasListElement extends BaseElement {
  static readonly ELEMENT_NAME = "lit-alias-list";

  private messenger: IClientMessenger = BrowserClientMessenger;

  @state()
  private _aliases: Alias[] = [];

  @state()
  private _filter: string = "";

  @query("#search")
  private searchInput: HTMLInputElement | undefined;

  override connectedCallback() {
    super.connectedCallback();
    this.initializeList();
  }

  private initializeList = async () => {
    const aliasesResponse = await this.messenger.send({
      type: RequestType.ALIASES_GET,
    });
    if (aliasesResponse.type !== ResponseType.ALIASES_GET) {
      return;
    }
    this._aliases = aliasesResponse.data.sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  };

  //////////////////////////////////////////////////////////
  // Search Bar
  //////////////////////////////////////////////////////////

  private handleSearchInput = () => {
    this._filter = this.searchInput?.value ?? "";
  };

  private createAliasFilter = (filter: string) => {
    const lowerFilter = filter.toLocaleLowerCase();
    return (alias: Alias) => {
      const fullMatch =
        alias.code.includes(filter) ||
        alias.link.toLocaleLowerCase().includes(lowerFilter) ||
        alias.note.toLocaleLowerCase().includes(lowerFilter);
      if (fullMatch) {
        return true;
      }

      if (filter.startsWith("c:") && alias.code.includes(filter.substring(2))) {
        return true;
      }

      if (
        filter.startsWith("l:") &&
        alias.link.toLocaleLowerCase().includes(lowerFilter.substring(2))
      ) {
        return true;
      }

      if (
        filter.startsWith("n:") &&
        alias.note.toLocaleLowerCase().includes(lowerFilter.substring(2))
      ) {
        return true;
      }
    };
  };

  private getFilteredAliases(): Alias[] {
    if (this._filter === "") {
      return this._aliases;
    }
    const filterFn = this.createAliasFilter(this._filter);
    return this._aliases.filter((a) => filterFn(a));
  }

  //////////////////////////////////////////////////////////
  // List Changes
  //////////////////////////////////////////////////////////

  createAlias = (alias: Alias) => {
    // insert in sorted order by code
    const index = this._aliases.findIndex(
      (a) => alias.code.localeCompare(a.code) < 0,
    );
    if (index === -1) {
      this._aliases = [...this._aliases, alias];
    } else {
      this._aliases = [
        ...this._aliases.slice(0, index),
        alias,
        ...this._aliases.slice(index),
      ];
    }
  };

  updateAlias = (alias: Alias) => {
    this._aliases = this._aliases.map((a) => (a.id === alias.id ? alias : a));
  };

  deleteAlias = (alias: Alias) => {
    this._aliases = this._aliases.filter((a) => a.id !== alias.id);
  };

  //////////////////////////////////////////////////////////
  // Result Counter
  //////////////////////////////////////////////////////////

  private getResultCountText(total: number, visible: number): string {
    const isSearching = this._filter.length !== 0;
    const countText = isSearching ? `${visible}\xa0/\xa0${total}` : `${total}`;
    return `${countText} result${total !== 1 ? "s" : "\xa0"}`;
  }

  //////////////////////////////////////////////////////////
  // Rendering
  //////////////////////////////////////////////////////////

  private renderEmptyAliases() {
    return html`
      <ul id="aliases">
        <li>
          <p style="text-align: center; margin-block: 2rem;">
            <i>You don't have any aliases yet.</i>
          </p>
        </li>
      </ul>
    `;
  }

  private renderAliasListEntries(aliases: Alias[]) {
    return html`
      ${aliases.map(
        (alias) => html`
          <li data-id=${alias.id} data-code=${alias.code}>
            <lit-alias-manager
              alias-id=${alias.id}
              code=${alias.code}
              link=${alias.link}
              note=${alias.note}
            ></lit-alias-manager>
          </li>
        `,
      )}
    `;
  }

  private renderAliasList(filtered: Alias[]) {
    return html`
      <ul id="aliases">
      ${
        this._aliases.length > 0
          ? this.renderAliasListEntries(filtered)
          : this.renderEmptyAliases()
      }
      </ul>
    `;
  }

  override render() {
    const filtered = this.getFilteredAliases();
    const resultCountText = this.getResultCountText(
      this._aliases.length,
      filtered.length,
    );
    return html`
      <div class="h-stack split">
        <div>
          <label for="search">Search:</label>
          <input id="search" type="text" aria-label="search" @input=${this.handleSearchInput}>
        </div>
        <span id="result-count">${resultCountText}</span>
      </div>
      ${this.renderAliasList(filtered)}
    `;
  }
}
