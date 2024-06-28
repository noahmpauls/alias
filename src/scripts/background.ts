import { browser } from "@alias/browser/index";
import type { Omnibox } from "webextension-polyfill";

type Alias = {
  command: string,
  url: string,
  description: string,
}

const ALIASES: Map<string, Alias> = new Map([
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
    command: "git alias",
    url: "https://github.com/noahmpauls/alias",
    description: "GitHub",
  },
  {
    command: "git bouncer",
    url: "https://github.com/noahmpauls/bouncer",
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
].map(a => [a.command, a]));

const getAliasMatch = (text: string): Alias | undefined => {
  return ALIASES.get(text);
}

const getAliasCompletions = (text: string): Alias[] => {
  return [...ALIASES.entries()]
    .filter(([ command, _]) => command.startsWith(text))
    .map(([_, alias]) => alias);
}

const getBestAlias = (text: string): Alias | undefined => {
  const match = getAliasMatch(text);
  if (match !== undefined) {
    return match;
  }
  const completions = getAliasCompletions(text);
  if (completions.length === 1) {
    return completions[0];
  }
  return undefined;
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
  const completions = getAliasCompletions(text);
  if (AUTOSELECT_ENABLED && completions.length === 1) {
    const alias = completions[0];
    console.log(`found an unambiguous alias: ${alias.command} (${alias.url})`)
    navigate(alias, AUTOSELECT_BEHAVIOR, true);
    return;
  }
  suggest(completions.map(a => ({
    content: a.command,
    description: a.description,
  })));
});

browser.omnibox.onInputEntered.addListener((text, disposition) => {
  const alias = getBestAlias(text);
  if (alias !== undefined) {
    console.log(`found an unambiguous alias: ${alias.command} (${alias.url})`)
    navigate(alias, disposition);
  }
});