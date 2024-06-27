import { browser } from "@alias/browser/index";
import type { Omnibox } from "webextension-polyfill";

type Alias = {
  command: string,
  url: string,
  description: string,
}

const ALIASES: Alias[] = [
  {
    command: "arch",
    url: "https://archlinux.org",
    description: "Arch Linux",
  },
  {
    command: "git",
    url: "https://github.com/",
    description: "GitHub",
  },
  {
    command: "hn",
    url: "https://news.ycombinator.com",
    description: "HackerNews",
  },
  {
    command: "mail",
    url: "https://app.fastmail.com",
    description: "Email"
  },
  {
    command: "mdn",
    url: "https://developer.mozilla.org",
    description: "MDN",
  },
  {
    command: "wiki",
    url: "https://en.wikipedia.org",
    description: "Wikipedia",
  },
];


const getAliases = (filter: string): Alias[] => {
  return ALIASES.filter(({ command }) => command.startsWith(filter));
}

const getCurrentTabId = async (): Promise<number | undefined> => {
  const tabs = await browser.tabs.query({ currentWindow: true, active: true });
  return tabs[0]?.id;
}

/**
 * Navigate to a duplicate of the current tab so that the omnibox is unfocused.
 * This prevents the omnibox from staying open after automatically navigating
 * before the user has triggered onInputEntered.
 */
const navigateToDuplicateTab = async (url: string): Promise<void> => {
  const oldId = await getCurrentTabId();
  if (oldId === undefined) {
    return;
  }
  const { id: newId } = await browser.tabs.duplicate(oldId);
  if (newId === undefined) {
    return;
  }
  await browser.tabs.update(newId, { url });
  browser.tabs.remove(oldId);
}

const navigate = (alias: Alias, disposition: Omnibox.OnInputEnteredDisposition, autoselected: boolean = false) => {
  const { url } = alias;
  switch (disposition) {
    // click suggestion
    case "currentTab": {
      autoselected
        ? navigateToDuplicateTab(alias.url)
        : browser.tabs.update({ url });
      break;
    }
    // ctrl+click suggestion
    case "newForegroundTab": {
      browser.tabs.create({ url, active: true });
      break;
    }
    // shft+ctrl+click suggestion
    case "newBackgroundTab": {
      browser.tabs.create({ url, active: false });
      break;
    }
  }
}

// Enable automatic navigation to alias target when user input becomes
// unambiguous.
const AUTOSELECT_ENABLED: boolean = false;
// Specify how to open auto-selected aliases. currentTab is the only well-
// supported option currently; on Firefox, newForegroundTab will cause the
// source tab to continuously spawn new tabs every time you navigate back
// to it. newBackgroundTab doesn't clear the omnibox once an alias is selected.
const AUTOSELECT_BEHAVIOR: Omnibox.OnInputEnteredDisposition = "currentTab";

browser.omnibox.onInputChanged.addListener((text, suggest) => {
  console.log(`input changed: ${text}`);
  const aliases = getAliases(text);
  if (AUTOSELECT_ENABLED && aliases.length === 1) {
    console.log(`got an alias: ${aliases[0].description}`);
    navigate(aliases[0], AUTOSELECT_BEHAVIOR, true);
    return;
  }
  suggest(aliases.map(a => ({
    content: a.command,
    description: a.description,
  })));
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  console.log(`alias not recognized: ${text}, ${disposition}`);
  const aliases = getAliases(text);
  if (aliases.length === 1) {
    navigate(aliases[0], disposition);
    return;
  }
});