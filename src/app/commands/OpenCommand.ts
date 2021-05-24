import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import LdrModelLoader from "../files/LdrModelLoader";
import { Store } from "vuex";
import AppState from "@/store/AppState";

@injectable()
export default class OpenCommand extends BaseCommand implements Command {
  private readonly api: Api;
  private readonly store: Store<AppState>;
  private readonly ldrModelLoader: LdrModelLoader;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.LdrModelLoader) ldrModelLoader: LdrModelLoader
  ) {
    super("open", "Open", "");

    this.api = api;
    this.store = store;
    this.ldrModelLoader = ldrModelLoader;
  }

  public ipcRendererAction(args: string[]): void {
    this.openFile(args[0], args[1]);
  }

  public async action(): Promise<void> {
    const file = await this.api.open();

    if (!file) {
      return;
    }

    this.openFile(file.name, file.content);
  }

  private async openFile(fileName: string, content: string): Promise<void> {
    const modelPromise = this.ldrModelLoader.loadString(fileName, content);

    this.store.dispatch("document/dirty", { dirty: false });
    this.store.dispatch("document/setFileName", { fileName: fileName });
    this.api.setRepresentedFilename(fileName);

    this.store.dispatch("document/setModel", { model: await modelPromise });
  }

  public get isDisabled(): boolean {
    return false;
  }
}
