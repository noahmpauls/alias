import type { Alias } from "@alias/alias";
import { browser } from "@alias/browser/index";
import { AliasData } from "@alias/data/AliasData";
import { EXAMPLE_ALIASES } from "@alias/data/sampleData";
import { BrowserStorage } from "@alias/storage";
import type Browser from "webextension-polyfill";

type Disposition = Browser.Omnibox.OnInputEnteredDisposition;

const aliasData = new AliasData(BrowserStorage.local());
aliasData.set(EXAMPLE_ALIASES);

const getAliasMatch = (aliases: Map<string, Alias>, text: string): Alias | undefined => {
  return aliases.get(text);
}

const getAliasCompletions = (aliases: Map<string, Alias>, text: string): Alias[] => {
  return [...aliases.entries()]
    .filter(([ code, _]) => code.startsWith(text))
    .map(([_, alias]) => alias);
}

const getBestAlias = (aliases: Map<string, Alias>, text: string): Alias | undefined => {
  const match = getAliasMatch(aliases, text);
  if (match !== undefined) {
    return match;
  }
  const completions = getAliasCompletions(aliases, text);
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

const navigate = (alias: Alias, disposition: Disposition, autoselected: boolean = false) => {
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

const manageAliases = async (command: string) => {
  if (command.startsWith("set ")) {
    const alias = parseAlias(command.substring("set ".length));
    if (alias === undefined) {
      return;
    }
    console.log(`creating alias: ${alias.code}, ${alias.url}, ${alias.description}`);
    await setAlias(alias);
    return;
  }
  if (command.startsWith("del ")) {
    const code = parseCode(command.substring("del ".length));
    if (code === undefined) {
      return;
    }
    console.log(`found alias to remove: ${code}`);
    await deleteAlias(code);
    return;
  }
}

const parseAlias = (params: string): Alias | undefined => {
  const code = parseString(params);
  const url = parseString(params.substring(`"${code ?? ""}" `.length));
  const description = parseString(params.substring(`"${code}" "${url}" `.length));
  if (code === undefined || url === undefined || description === undefined) {
    return undefined;
  }
  return { code, url, description };
}

const parseCode = (params: string): string | undefined => {
  return parseString(params);
}

const parseString = (text: string): string | undefined => {
  const startQuote = text.indexOf("\"");
  if (startQuote === -1) {
    return undefined;
  }
  const endQuote = text.indexOf("\"", startQuote + 1);
  if (endQuote === -1) {
    return undefined;
  }
  return text.substring(startQuote + 1, endQuote);
}

const setAlias = async (alias: Alias) => {
  const aliases = await aliasData.get();
  const existingIndex = aliases.findIndex(a => a.code === alias.code);
  if (existingIndex !== -1) {
    aliases.splice(existingIndex, 1);
  }
  aliases.push(alias);
  await aliasData.set(aliases);
}

const deleteAlias = async (code: string) => {
  const aliases = await aliasData.get();
  const removeIndex = aliases.findIndex(a => a.code === code);
  if (removeIndex === -1) {
    return;
  }
  aliases.splice(removeIndex, 1);
  await aliasData.set(aliases);
}

// Enable automatic navigation to alias target when user input becomes
// unambiguous.
const AUTOSELECT_ENABLED: boolean = false;
// Specify how to open auto-selected aliases. currentTab is the only well-
// supported option currently; on Firefox, newForegroundTab will cause the
// source tab to continuously spawn new tabs every time you navigate back
// to it. newBackgroundTab doesn't clear the omnibox once an alias is selected.
const AUTOSELECT_BEHAVIOR: Disposition = "currentTab";

browser.omnibox.onInputChanged.addListener(async (text, suggest) => {
  const aliases = new Map((await aliasData.get()).map(a => [a.code, a]));
  const completions = getAliasCompletions(aliases, text);
  if (AUTOSELECT_ENABLED && completions.length === 1) {
    const alias = completions[0];
    console.log(`found an unambiguous alias: ${alias.code} (${alias.url})`)
    navigate(alias, AUTOSELECT_BEHAVIOR, true);
    return;
  }
  suggest(completions.map(a => ({
    content: a.code,
    description: a.description,
  })));
});

browser.omnibox.onInputEntered.addListener(async (text, disposition) => {
  if (text.startsWith("alias ")) {
    await manageAliases(text.substring("alias ".length));
  }
  const aliases = new Map((await aliasData.get()).map(a => [a.code, a]));
  const alias = getBestAlias(aliases, text);
  if (alias !== undefined) {
    console.log(`found an unambiguous alias: ${alias.code} (${alias.url})`)
    navigate(alias, disposition);
  }
});