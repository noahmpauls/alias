import type { PageName } from "./AliasPagesElement";

const ALIAS_PAGER_NAME = "alias-pager";

export class AliasPagerElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_PAGER_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_PAGER_NAME)) {
      window.AliasPagerElement = AliasPagerElement;
      window.customElements.define(ALIAS_PAGER_NAME, AliasPagerElement);
    }
  }

  constructor() {
    super();
  }

  connectedCallback() {
    this.addEventListener("click", this.setPage)
  }

  private setPage = () => {
    const pageName = this.getAttribute("page");
    if (pageName === null) {
      console.warn("no page name provided");
      return;
    }
    this.dispatchEvent(new CustomEvent<PageName>("setpage", {
      detail: pageName,
      bubbles: true,
    }));
  }

}