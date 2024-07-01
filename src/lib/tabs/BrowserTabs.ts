import { browser } from "@alias/browser";

export const BrowserTabs = {
  updateCurrent: (url: string) => browser.tabs.update({ url }),
  create: (url: string, active: boolean) => browser.tabs.create({ url, active }),
};
