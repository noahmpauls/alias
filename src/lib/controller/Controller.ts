import type { Alias, AliasCreate } from "@alias/alias";
import type { IContextSet } from "@alias/data";
import { OmniboxEventType, type OmniboxChangeEvent, type OmniboxEnterEvent, type OmniboxEvent } from "@alias/events";
import { ClientMessageType, ControllerMessageType, type ClientAliasCreateMessage, type ClientAliasDeleteMessage, type ClientAliasUpdateMessage, type ClientAliasesGetMessage, type FrameMessage, type FromFrame, type IControllerMessenger } from "@alias/message";
import { BrowserControllerMessenger } from "@alias/message/browser";
import { BrowserTabs, type ITabs } from "@alias/tabs";

export class Controller {
  constructor(
    private readonly aliases: IContextSet<Alias>,
    private readonly tabs: ITabs,
    private readonly messenger: IControllerMessenger,
  ) { }

  static browser = (
    aliases: IContextSet<Alias>,
  ): Controller => {
    return new Controller(aliases, BrowserTabs, BrowserControllerMessenger);
  }

  handleOmnibox = (event: OmniboxEvent) => {
    switch (event.type) {
      case (OmniboxEventType.CHANGE): {
        this.handleOmniboxChange(event);
        break;
      }
      case (OmniboxEventType.ENTER): {
        this.handleOmniboxEnter(event);
        break;
      }
    }
  }

  private readonly handleOmniboxChange = (event: OmniboxChangeEvent) => {
    const { text, suggest } = event;
    const completions = this.getAliasCompletions(text);
    completions.sort((a, b) => a.code.localeCompare(b.code));
    suggest(completions.map(a => ({
      content: a.code,
      description: a.name,
    })));
  }

  private readonly handleOmniboxEnter = (event: OmniboxEnterEvent) => {
    const { text, disposition } = event;
    // TODO: get rid of this eventually; keeping here for testing.
    if (text.startsWith("alias ")) {
      this.manageAliases(text.substring("alias ".length));
    }
    const alias = this.getBestAlias(text);
    if (alias === undefined) {
      return;
    }
    switch (disposition) {
      case "currentTab": {
        this.tabs.updateCurrent(alias.link);
        break;
      }
      case "newForegroundTab": {
        this.tabs.create(alias.link, true);
        break;
      }
      case "newBackgroundTab": {
        this.tabs.create(alias.link, false);
      }
    }
  }

  handleMessage = (message: FrameMessage) => {
    switch (message.type) {
      case ClientMessageType.ALIASES_GET: {
        this.handleAliasesGet(message);
        break;
      }
      case ClientMessageType.ALIAS_CREATE: {
        this.handleAliasCreate(message);
        break;
      }
      case ClientMessageType.ALIAS_UPDATE: {
        this.handleAliasUpdate(message);
        break;
      }
      case ClientMessageType.ALIAS_DELETE: {
        this.handleAliasDelete(message);
        break;
      }
    }
  }

  private handleAliasesGet = (message: FromFrame<ClientAliasesGetMessage>) => {
    const { tabId, frameId } = message;
    const aliases = this.aliases.get();
    this.messenger.send({
      type: ControllerMessageType.ALIASES_GET,
      aliases,
    });
  }

  private handleAliasCreate = (message: FromFrame<ClientAliasCreateMessage>) => {
    const { tabId, frameId, alias: createAlias } = message;
    const newAlias = {
      ...createAlias,
      id: crypto.randomUUID(),
    };
    this.aliases.create(newAlias);
    const aliases = this.aliases.get();
    this.messenger.send({
      type: ControllerMessageType.ALIASES_GET,
      aliases,
    });
  }

  private handleAliasUpdate = (message: FromFrame<ClientAliasUpdateMessage>) => {
    const { tabId, frameId, alias: updateAlias } = message;
    const existingAlias = this.aliases.get(a => a.id === updateAlias.id)[0];
    if (existingAlias === undefined) {
      console.warn(`attempting to update non-existent alias ${updateAlias.id}`);
      return;
    }
    // TODO: yuck. This just looks bad, and there's no validation.
    if (updateAlias.name !== undefined) {
      existingAlias.name = updateAlias.name;
    }
    if (updateAlias.name !== undefined) {
      existingAlias.name = updateAlias.name;
    }
    if (updateAlias.name !== undefined) {
      existingAlias.name = updateAlias.name;
    }
    const aliases = this.aliases.get();
    this.messenger.send({
      type: ControllerMessageType.ALIASES_GET,
      aliases,
    });
  }

  private handleAliasDelete = (message: FromFrame<ClientAliasDeleteMessage>) => {
    const { tabId, frameId, alias: deleteAlias } = message;
    const existingAlias = this.aliases.get(a => a.id === deleteAlias.id)[0];
    if (existingAlias === undefined) {
      console.warn(`attempting to delete non-existent alias ${deleteAlias.id}`);
      return;
    }
    this.aliases.delete(existingAlias);
    const aliases = this.aliases.get();
    this.messenger.send({
      type: ControllerMessageType.ALIASES_GET,
      aliases,
    });
  }

  private getAliasMatch = (code: string): Alias | undefined => {
    return this.aliases.get(a => a.code === code)[0];
  }

  private getAliasCompletions = (codePrefix: string): Alias[] => {
    return this.aliases.get(a => a.code.startsWith(codePrefix));
  }

  private getBestAlias = (text: string): Alias | undefined => {
    const match = this.getAliasMatch(text);
    if (match !== undefined) {
      return match;
    }
    const completions = this.getAliasCompletions(text);
    if (completions.length === 1) {
      return completions[0];
    }
    return undefined;
  }

  private manageAliases = async (command: string) => {
    if (command.startsWith("set ")) {
      const alias = parseAlias(command.substring("set ".length));
      if (alias === undefined) {
        return;
      }
      await this.setAlias({ ...alias, id: crypto.randomUUID() });
      return;
    }
    if (command.startsWith("del ")) {
      const code = parseCode(command.substring("del ".length));
      if (code === undefined) {
        return;
      }
      await this.deleteAlias(code);
      return;
    }
  }

  private setAlias = async (alias: Alias) => {
    const existingAlias = this.aliases.get(a => a.code === alias.code)[0];
    if (existingAlias !== undefined) {
      existingAlias.name = alias.name;
      existingAlias.code = alias.code;
      existingAlias.link = alias.link;
    } else {
      this.aliases.create(alias);
    }
  }

  private deleteAlias = async (code: string) => {
    const existingAlias = this.aliases.get(a => a.code === code)[0];
    if (existingAlias !== undefined) {
      this.aliases.delete(existingAlias);
    }
  }
}

const parseAlias = (params: string): AliasCreate | undefined => {
  const code = parseString(params);
  const link = parseString(params.substring(`"${code ?? ""}" `.length));
  const name = parseString(params.substring(`"${code}" "${link}" `.length));
  if (code === undefined || link === undefined || name === undefined) {
    return undefined;
  }
  return { code, link, name };
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
