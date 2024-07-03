import type { ClientMessage } from "@alias/message";
import type { Omnibox } from "webextension-polyfill";

export interface IWorkerEventEmitter {
  start(): void;
  stop(): void;
  readonly onMessage: EventHook<ClientMessage>
  readonly onOmnibox: EventHook<OmniboxEvent>
}

export type EventListener<E> = (event: E) => Promise<void>

export type EventHook<E> = {
  addListener(listener: EventListener<E>): void;
  removeListener(listener: EventListener<E>): void;
}

export enum OmniboxEventType {
  CHANGE = "change",
  ENTER = "enter",
}

export type OmniboxEvent =
    OmniboxChangeEvent
  | OmniboxEnterEvent
  ;

export type OmniboxChangeEvent = {
  type: OmniboxEventType.CHANGE,
  text: string,
  suggest: (suggestions: Omnibox.SuggestResult[]) => void,
}

export type OmniboxEnterEvent = {
  type: OmniboxEventType.ENTER,
  text: string,
  disposition: Omnibox.OnInputEnteredDisposition
}