const ALIAS_PAGES_NAME = "alias-pages";

export type PageName = string;

export class AliasPagesElement extends HTMLElement {
  static readonly ELEMENT_NAME = ALIAS_PAGES_NAME;

  static register = () => {
    if (!window.customElements.get(ALIAS_PAGES_NAME)) {
      window.AliasPagesElement = AliasPagesElement;
      window.customElements.define(ALIAS_PAGES_NAME, AliasPagesElement);
    }
  }

  private target: HTMLElement | undefined;

  constructor() {
    super();
  }

  connectedCallback() {
    this.target = this.getTarget();
    const defaultPage = this.getDefaultPage();
    if (defaultPage) {
      this.setPage(defaultPage);
    }
    this.addEventListener("setpage", event => this.setPage(event.detail));
  }

  private getTarget = (): HTMLElement => {
    const targetElementId = this.getAttribute("target");
    if (targetElementId === null) {
      return this;
    }
    const element = document.getElementById(targetElementId);
    if (element === null) {
      console.error("alias-pages could not find target!");
    }
    return element ?? this;
  }

  private getDefaultPage = (): PageName | null => {
    const defaultPage = this.getAttribute("default");
    if (defaultPage) {
      return defaultPage;
    }
    const firstPage = this.querySelector("[data-page]") as HTMLElement | null;
    return firstPage?.dataset.page ?? null;
  }

  private setPage = (pageName: PageName) => {
    let visiblePage = this.getPageByName(pageName);
    if (visiblePage === null) {
      console.error(`page not found: ${pageName}`);
      return;
    }
    for (const pageElement of this.target?.children ?? []) {
      const page = pageElement as HTMLElement;
      if (page !== visiblePage) {
        page.style.display = "none";
      }
    }
    visiblePage.style.display = "";
  }

  private getPageByName = (pageName: PageName): HTMLElement | null => {
    for (const pageElement of this.target?.children ?? []) {
      const page = pageElement as HTMLElement;
      if (page.dataset.page === pageName) {
        return page;
      }
    }
    return null;
  }
}