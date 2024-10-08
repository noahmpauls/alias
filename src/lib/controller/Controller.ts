import type { Alias, AliasCreate } from "@alias/alias";
import type { IContextSet } from "@alias/data";
import { OmniboxEventType, type OmniboxChangeEvent, type OmniboxEnterEvent, type OmniboxEvent } from "@alias/events";
import { RequestType, ResponseType, type AliasCreateRequest, type AliasDeleteRequest, type AliasUpdateRequest, type AliasesGetRequest, type RequestMessage, type Respondable } from "@alias/message";
import { BrowserTabs, type ITabs } from "@alias/tabs";

export class Controller {
  constructor(
    private readonly aliases: IContextSet<Alias>,
    private readonly tabs: ITabs,
  ) { }

  static browser = (
    aliases: IContextSet<Alias>,
  ): Controller => {
    return new Controller(aliases, BrowserTabs);
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
      description: a.note,
    })));
  }

  private readonly handleOmniboxEnter = (event: OmniboxEnterEvent) => {
    const { text, disposition } = event;
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

  handleRequest = (request: Respondable<RequestMessage>) => {
    switch (request.type) {
      case RequestType.ALIASES_GET: {
        this.handleAliasesGet(request);
        break;
      }
      case RequestType.ALIAS_CREATE: {
        this.handleAliasCreate(request);
        break;
      }
      case RequestType.ALIAS_UPDATE: {
        this.handleAliasUpdate(request);
        break;
      }
      case RequestType.ALIAS_DELETE: {
        this.handleAliasDelete(request);
        break;
      }
    }
  }

  private handleAliasesGet = (message: Respondable<AliasesGetRequest>) => {
    const aliases = this.aliases.get();
    message.respond({
      type: ResponseType.ALIASES_GET,
      data: aliases,
    });
  }

  private handleAliasCreate = (message: Respondable<AliasCreateRequest>) => {
    const createAlias = message.data;
    const existing = this.aliases.get(a => a.code === createAlias.code);
    if (existing.length > 0) {
      message.respond({
        type: ResponseType.ERROR,
        data: {
          message: `Alias "${createAlias.code}" already exists.`
        },
      });
      return;
    }
    const newAlias = {
      ...createAlias,
      id: crypto.randomUUID(),
    };
    this.aliases.create(newAlias);
    message.respond({
      type: ResponseType.ALIAS_CREATE,
      data: newAlias,
    });
  }

  private handleAliasUpdate = (message: Respondable<AliasUpdateRequest>) => {
    const updateAlias = message.data;
    const existingAlias = this.aliases.get(a => a.id === updateAlias.id)[0];
    if (existingAlias === undefined) {
      return {
        type: ResponseType.ERROR,
        data: {
          message: `Alias with ID ${updateAlias.id} does not exist.`,
        }
      }
    }
    const existing = this.aliases.get(a => a.id !== updateAlias.id && a.code === updateAlias.code);
    if (existing.length > 0) {
      message.respond({
        type: ResponseType.ERROR,
        data: {
          message: `Alias "${updateAlias.code}" already exists.`
        },
      });
      return;
    }
    // TODO: yuck. This just looks bad, and there's no validation.
    if (updateAlias.note !== undefined) {
      existingAlias.note = updateAlias.note;
    }
    if (updateAlias.code !== undefined) {
      existingAlias.code = updateAlias.code;
    }
    if (updateAlias.link !== undefined) {
      existingAlias.link = updateAlias.link;
    }
    message.respond({
      type: ResponseType.ALIAS_UPDATE,
      data: existingAlias,
    });
  }

  private handleAliasDelete = (message: Respondable<AliasDeleteRequest>) => {
    const deleteAlias = message.data;
    const existingAlias = this.aliases.get(a => a.id === deleteAlias.id)[0];
    if (existingAlias === undefined) {
      message.respond({
        type: ResponseType.ERROR,
        data: {
          message: `Alias with ID ${deleteAlias.id} does not exist.`,
        }
      });
      return;
    }
    this.aliases.delete(existingAlias);
    message.respond({
      type: ResponseType.ALIAS_DELETE,
      data: existingAlias,
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
}
