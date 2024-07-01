import { browser } from "@alias/browser";
import { OmniboxEventType, type EventHook, type EventListener, type IWorkerEventEmitter, type OmniboxEvent } from "./types";
import type { Omnibox } from "webextension-polyfill";

export class BrowserEvents implements IWorkerEventEmitter {
  private readonly listeners: {
    omnibox: EventListener<OmniboxEvent>[],
  } = {
    omnibox: []
  }

  constructor() { }

  static browser = () => {
    return new BrowserEvents();
  }
  
  readonly onOmnibox: EventHook<OmniboxEvent> = this.createHook(this.listeners.omnibox);

  start = () => {
    browser.omnibox.onInputChanged.addListener(this.handleOmniboxChange)
    browser.omnibox.onInputEntered.addListener(this.handleOmniboxEnter)
  }

  stop = () => {
    browser.omnibox.onInputChanged.removeListener(this.handleOmniboxChange)
    browser.omnibox.onInputEntered.removeListener(this.handleOmniboxEnter)
  }

  private handleOmniboxChange = async (text: string, suggest: (suggestions: Omnibox.SuggestResult[]) => void) => {
    this.triggerListeners(this.listeners.omnibox, {
      type: OmniboxEventType.CHANGE,
      text,
      suggest,
    });
  }

  private handleOmniboxEnter = async (text: string, disposition: Omnibox.OnInputEnteredDisposition) => {
    this.triggerListeners(this.listeners.omnibox, {
      type: OmniboxEventType.ENTER,
      text,
      disposition,
    });
  }

  private createHook<E>(listeners: EventListener<E>[]): EventHook<E> {
    return {
      addListener: (listener: EventListener<E>) => this.addEventListener(listeners, listener),
      removeListener: (listener: EventListener<E>) => this.removeEventListener(listeners, listener),
    }
  }

  private addEventListener<E>(listeners: EventListener<E>[], listener: EventListener<E>) {
    listeners.push(listener);
  }

  private removeEventListener<E>(listeners: EventListener<E>[], listener: EventListener<E>) {
    const existing = listeners.indexOf(listener);
    if (existing !== -1) {
      listeners.splice(existing, 1);
    }
  }

  private async triggerListeners<E>(listeners: EventListener<E>[], event: E) {
    await Promise.all(listeners.map(l => l(event)));
  }
}
