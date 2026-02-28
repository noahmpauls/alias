import { LitElement } from "lit";

export abstract class BaseElement extends LitElement {
  protected override createRenderRoot(): HTMLElement | DocumentFragment {
    // No shadow root, since styles shouldn't be encapsulated.
    return this;
  }
}
