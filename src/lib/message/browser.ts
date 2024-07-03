import { browser } from "@alias/browser";
import type { ClientMessage, ControllerMessage, IClientMessenger, IControllerMessenger } from "./types";

export const BrowserClientMessenger: IClientMessenger = {
  send: (message: ClientMessage) => {
    browser.runtime.sendMessage(message);
  },

  addReceiver: (receiver: (message: ControllerMessage) => void) => {
    browser.runtime.onMessage.addListener(receiver);
  },

  removeReceiver: (receiver: (message: ControllerMessage) => void) => {
    browser.runtime.onMessage.removeListener(receiver);
  }
}

export const BrowserControllerMessenger: IControllerMessenger = {
  send: (message: ControllerMessage) => {
    browser.runtime.sendMessage(message);
  }
}
