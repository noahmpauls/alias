import { customElement, property } from "lit/decorators.js";
import { BaseElement } from "./BaseElement";

type PageName = string;

declare global {
  interface HTMLElementTagNameMap {
    [LitAliasPagesElement.ELEMENT_NAME]: LitAliasPagesElement;
  }
}

@customElement("lit-alias-pages")
export class LitAliasPagesElement extends BaseElement {
  static readonly ELEMENT_NAME = "lit-alias-pages";

  @property({ type: String, reflect: true })
  target: string = "";

  @property({ type: String, reflect: true })
  default: string = "";

  override connectedCallback() {
    super.connectedCallback();
    const defaultPage = this.getDefaultPage();
    if (defaultPage !== null) {
      this.setPage(defaultPage);
    }
    this.addEventListener("setpage", (event) => this.setPage(event.detail));
  }

  private getDefaultPage(): PageName | null {
    if (this.default !== "") {
      return this.default;
    }
    const firstPage = this.querySelector("[data-page]") as HTMLElement | null;
    return firstPage?.dataset.page ?? null;
  }

  private getTarget(): HTMLElement {
    if (this.target === "") {
      return this;
    }
    const element = document.getElementById(this.target);
    if (element === null) {
      console.error("lit-alias-pages could not find target!");
    }
    return element ?? this;
  }

  private setPage(pageName: PageName) {
    const target = this.getTarget();
    const visiblePage = this.getPageByName(target, pageName);
    if (visiblePage === null) {
      console.error(`page not found: ${pageName}`);
      return;
    }
    for (const pageElement of target.children) {
      const page = pageElement as HTMLElement;
      page.style.display = page !== visiblePage ? "none" : "";
    }
  }

  private getPageByName(
    target: HTMLElement,
    pageName: PageName,
  ): HTMLElement | null {
    for (const pageElement of target.children) {
      const page = pageElement as HTMLElement;
      if (page.dataset.page === pageName) {
        return page;
      }
    }
    return null;
  }

  override render() {
    return;
  }
}
