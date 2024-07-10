import type { RequestMessage, Respondable } from "@alias/message";
import type { Omnibox } from "webextension-polyfill";

export interface IWorkerEventEmitter {
  start(): void;
  stop(): void;
  readonly onRequest: EventHook<Respondable<RequestMessage>>
  readonly onOmnibox: EventHook<OmniboxEvent>
}

export type EventListener<E> = (event: E) => Promise<void>

export type EventHook<E> = {
  set(listener: EventListener<E>): void;
  clear(): void;
}

export enum OmniboxEventType {
  CHANGE = "change",
  ENTER = "enter",
}

export type OmniboxEvent =
  | OmniboxChangeEvent
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