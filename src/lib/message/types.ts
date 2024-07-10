import type { Alias, AliasCreate, AliasDelete, AliasUpdate } from "@alias/alias";

export type IClientMessenger = {
  send: (message: RequestMessage) => Promise<ResponseMessage>,
}

export enum RequestType {
  ALIASES_GET,
  ALIAS_CREATE,
  ALIAS_UPDATE,
  ALIAS_DELETE,
}

export type Respondable<R> = R & {
  respond: (response: ResponseMessage) => void,
}

export type RequestMessage =
  | AliasesGetRequest
  | AliasCreateRequest
  | AliasUpdateRequest
  | AliasDeleteRequest
  ;

export type AliasesGetRequest = {
  type: RequestType.ALIASES_GET,
  data?: never,
}

export type AliasCreateRequest = {
  type: RequestType.ALIAS_CREATE,
  data: AliasCreate,
}

export type AliasUpdateRequest = {
  type: RequestType.ALIAS_UPDATE,
  data: AliasUpdate,
}

export type AliasDeleteRequest = {
  type: RequestType.ALIAS_DELETE,
  data: AliasDelete,
}


export enum ResponseType {
  ERROR,
  ALIASES_GET,
  ALIAS_CREATE,
  ALIAS_UPDATE,
  ALIAS_DELETE,
}

export type ResponseMessage =
  | ErrorResponse
  | AliasesGetResponse
  | AliasCreateResponse
  | AliasUpdateResponse
  | AliasDeleteResponse
  ;

export type ErrorResponse = {
  type: ResponseType.ERROR,
  data: {
    message: string,
  }
}

export type AliasesGetResponse = {
  type: ResponseType.ALIASES_GET,
  data: Alias[],
}

export type AliasCreateResponse = {
  type: ResponseType.ALIAS_CREATE,
  data: Alias,
}

export type AliasUpdateResponse = {
  type: ResponseType.ALIAS_UPDATE,
  data: Alias,
}

export type AliasDeleteResponse = {
  type: ResponseType.ALIAS_DELETE,
  data: Alias,
}
