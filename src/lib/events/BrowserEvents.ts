import { browser } from "@alias/browser";
import type { RequestMessage, Respondable } from "@alias/message";
import type Browser from "webextension-polyfill";
import {
  type EventListener,
  type IWorkerEventEmitter,
  type OmniboxEvent,
  OmniboxEventType,
} from "./types";

type MessageSender = Pick<Browser.Runtime.MessageSender, "frameId"> & {
  tab?: Pick<Browser.Tabs.Tab, "id">;
};

export class BrowserEvents implements IWorkerEventEmitter {
  private readonly listeners: {
    request: EventListener<Respondable<RequestMessage>> | undefined;
    omnibox: EventListener<OmniboxEvent> | undefined;
  } = {
    request: undefined,
    omnibox: undefined,
  };

  static browser = () => {
    return new BrowserEvents();
  };

  readonly onRequest = {
    set: (listener: EventListener<Respondable<RequestMessage>>) => {
      this.listeners.request = listener;
    },
    clear: () => (this.listeners.request = undefined),
  };

  readonly onOmnibox = {
    set: (listener: EventListener<OmniboxEvent>) => {
      this.listeners.omnibox = listener;
    },
    clear: () => (this.listeners.omnibox = undefined),
  };

  start = () => {
    browser.omnibox.onInputChanged.addListener(this.handleOmniboxChange);
    browser.omnibox.onInputEntered.addListener(this.handleOmniboxEnter);
    browser.runtime.onMessage.addListener(this.handleMessage);
  };

  stop = () => {
    browser.omnibox.onInputChanged.removeListener(this.handleOmniboxChange);
    browser.omnibox.onInputEntered.removeListener(this.handleOmniboxEnter);
    browser.runtime.onMessage.removeListener(this.handleMessage);
  };

  private handleOmniboxChange = async (
    text: string,
    suggest: (suggestions: Browser.Omnibox.SuggestResult[]) => void,
  ) => {
    if (this.listeners.omnibox === undefined) {
      return;
    }
    this.listeners.omnibox({
      type: OmniboxEventType.CHANGE,
      text,
      suggest,
    });
  };

  private handleOmniboxEnter = async (
    text: string,
    disposition: Browser.Omnibox.OnInputEnteredDisposition,
  ) => {
    if (this.listeners.omnibox === undefined) {
      return;
    }
    this.listeners.omnibox({
      type: OmniboxEventType.ENTER,
      text,
      disposition,
    });
  };

  private handleMessage = (
    message: RequestMessage,
    _sender: MessageSender,
    sendResponse: (response: unknown) => void,
  ) => {
    if (this.listeners.request === undefined) {
      // TODO: anything special needed here?
      return;
    }
    const request: Respondable<RequestMessage> = {
      ...message,
      respond: sendResponse,
    };
    this.listeners.request(request);
    return true;
  };
}
