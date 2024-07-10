import { SyncedCache } from "@alias/cache";
import { Controller } from "@alias/controller";
import { AliasContext } from "@alias/data";
import { BrowserEvents, type IWorkerEventEmitter, type OmniboxEvent } from "@alias/events";
import type { RequestMessage, Respondable } from "@alias/message";

export class Worker<TEvents extends IWorkerEventEmitter> {
  private readonly controller: SyncedCache<Controller>;
  constructor(
    readonly events: TEvents,
    private readonly context: AliasContext,
    private readonly initializeController: (context: AliasContext) => Promise<Controller>,
  ) {
    this.controller = new SyncedCache(this.createController);
  }

  static browser = (): Worker<IWorkerEventEmitter> => {
    return new Worker(
      BrowserEvents.browser(),
      AliasContext.browser(),
      async (context) => {
        const aliases = await context.fetch();
        return Controller.browser(aliases);
      }
    );
  }

  private createController = async (): Promise<Controller> =>
    this.initializeController(this.context);

  private onOmnibox = async (event: OmniboxEvent) => {
    const controller = await this.controller.value();
    controller.handleOmnibox(event);
    await this.context.commit();
  }

  private onRequest = async (request: Respondable<RequestMessage>) => {
    this.controller.value()
      .then(controller => controller.handleRequest(request))
      .then(() => this.context.commit());
  }

  start = () => {
    this.events.onOmnibox.set(this.onOmnibox);
    this.events.onRequest.set(this.onRequest);
    this.events.start();
  }

  stop = () => {
    this.events.stop();
    this.events.onRequest.clear();
    this.events.onOmnibox.clear();
  }

  clear = async () => {
    await this.context.clear();
    await this.controller.clear();
  }
}