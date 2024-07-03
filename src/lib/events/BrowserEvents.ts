import { browser } from "@alias/browser";
import { OmniboxEventType, type EventHook, type EventListener, type IWorkerEventEmitter, type OmniboxEvent } from "./types";
import type Browser from "webextension-polyfill";
import type { ClientMessage } from "@alias/message";

type MessageSender = Pick<Browser.Runtime.MessageSender, "frameId"> & {
  tab?: Pick<Browser.Tabs.Tab, "id">
}

export class BrowserEvents implements IWorkerEventEmitter {
  private readonly listeners: {
    message: EventListener<ClientMessage>[],
    omnibox: EventListener<OmniboxEvent>[],
  } = {
    message: [],
    omnibox: [],
  }

  constructor() { }

  static browser = () => {
    return new BrowserEvents();
  }
  
  readonly onMessage: EventHook<ClientMessage> = this.createHook(this.listeners.message);
  readonly onOmnibox: EventHook<OmniboxEvent> = this.createHook(this.listeners.omnibox);

  start = () => {
    browser.omnibox.onInputChanged.addListener(this.handleOmniboxChange);
    browser.omnibox.onInputEntered.addListener(this.handleOmniboxEnter);
    browser.runtime.onMessage.addListener(this.handleMessage);
  }

  stop = () => {
    browser.omnibox.onInputChanged.removeListener(this.handleOmniboxChange);
    browser.omnibox.onInputEntered.removeListener(this.handleOmniboxEnter);
    browser.runtime.onMessage.removeListener(this.handleMessage);
  }

  private handleOmniboxChange = async (text: string, suggest: (suggestions: Browser.Omnibox.SuggestResult[]) => void) => {
    this.triggerListeners(this.listeners.omnibox, {
      type: OmniboxEventType.CHANGE,
      text,
      suggest,
    });
  }

  private handleOmniboxEnter = async (text: string, disposition: Browser.Omnibox.OnInputEnteredDisposition) => {
    this.triggerListeners(this.listeners.omnibox, {
      type: OmniboxEventType.ENTER,
      text,
      disposition,
    });
  }

  private handleMessage = async (message: ClientMessage, sender: MessageSender) => {
    console.log(message)
    if (sender.tab?.id === undefined || sender.frameId === undefined) {
      console.warn(`message from tab ${sender.tab?.id}, frame ${sender.frameId}`);
      // return;
    }
    await this.triggerListeners(this.listeners.message, {
      ...message,
      tabId: -1, //sender.tab.id,
      frameId: -1, //sender.frameId,
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
