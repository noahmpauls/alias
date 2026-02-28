import { customElement, property } from "lit/decorators.js";
import type { PageName } from "./AliasPagesElement";
import { BaseElement } from "./BaseElement";

declare global {
  interface HTMLElementTagNameMap {
    [AliasPagerElement.ELEMENT_NAME]: AliasPagerElement;
  }
}

@customElement("alias-pager")
export class AliasPagerElement extends BaseElement {
  static readonly ELEMENT_NAME = "alias-pager";

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
