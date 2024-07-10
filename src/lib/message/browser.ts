import { browser } from "@alias/browser";
import type { IClientMessenger, RequestMessage, ResponseMessage } from "./types";

export const BrowserClientMessenger: IClientMessenger = {
  send: (request: RequestMessage): Promise<ResponseMessage> => {
    return browser.runtime.sendMessage(request);
  },
}
