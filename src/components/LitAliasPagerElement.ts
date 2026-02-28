import { customElement, property } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";
import type { PageName } from "./LitAliasPagesElement";

declare global {
  interface HTMLElementTagNameMap {
    [LitAliasPagerElement.ELEMENT_NAME]: LitAliasPagerElement;
  }
}

@customElement("lit-alias-pager")
export class LitAliasPagerElement extends BaseElement {
  static readonly ELEMENT_NAME = "lit-alias-pager";

  @property({ type: String, reflect: true })
  page: PageName = "";

  override connectedCallback() {
    super.connectedCallback();
    this.addEventListener("click", this.setPage);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("click", this.setPage);
  }

  private setPage = () => {
    if (this.page === "") {
      console.warn("no page name provided");
      return;
    }
    this.dispatchEvent(
      new CustomEvent<PageName>("setpage", {
        detail: this.page,
        bubbles: true,
      }),
    );
  };

  override render() {
    return;
  }
}
