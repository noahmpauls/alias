import { SyncedCache } from "@alias/cache";
import { Controller } from "@alias/controller";
import { AliasContext } from "@alias/data";
import { BrowserEvents, type IWorkerEventEmitter, type OmniboxEvent } from "@alias/events";

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

  start = () => {
    this.events.onOmnibox.addListener(this.onOmnibox);
    this.events.start();
  }

  stop = () => {
    this.events.stop();
    this.events.onOmnibox.removeListener(this.onOmnibox);
  }

  clear = async () => {
    await this.context.clear();
    await this.controller.clear();
  }
}