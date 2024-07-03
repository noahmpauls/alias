import type { Alias, AliasCreate, AliasDelete, AliasUpdate } from "@alias/alias";

export interface IClientMessenger {
  send(message: ClientMessage): void;
  addReceiver(listener: (message: ControllerMessage) => void): void;
  removeReceiver(listener: (message: ControllerMessage) => void): void;
}

export enum ClientMessageType {
  ALIASES_GET = "client:aliases:get",
  ALIAS_CREATE = "client:alias:create",
  ALIAS_UPDATE = "client:alias:update",
  ALIAS_DELETE = "client:alias:delete",
}

export type ClientMessage =
    ClientAliasesGetMessage
  | ClientAliasCreateMessage
  | ClientAliasUpdateMessage
  | ClientAliasDeleteMessage
  ;

export type ClientAliasesGetMessage = {
  type: ClientMessageType.ALIASES_GET,
}

export type ClientAliasCreateMessage = {
  type: ClientMessageType.ALIAS_CREATE,
  alias: AliasCreate,
}

export type ClientAliasUpdateMessage = {
  type: ClientMessageType.ALIAS_UPDATE
  alias: AliasUpdate,
}

export type ClientAliasDeleteMessage = {
  type: ClientMessageType.ALIAS_DELETE
  alias: AliasDelete,
}

export type FromFrame<T> = T & {
  tabId: number,
  frameId: number,
}

export type FrameMessage = FromFrame<ClientMessage>


export interface IControllerMessenger {
  send(message: ControllerMessage): void;
}

export enum ControllerMessageType {
  ALIASES_GET = "controller:aliases:get"
}

export type ControllerMessage =
    ControllerAliasesGetMessage
  ;

export type ControllerAliasesGetMessage = {
  type: ControllerMessageType.ALIASES_GET,
  aliases: Alias[],
}