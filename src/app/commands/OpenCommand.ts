import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import { Store } from "vuex";
import AppState from "@/store/AppState";

@injectable()
export default class OpenCommand extends BaseCommand implements Command {
  private readonly api: Api;
  private readonly store: Store<AppState>;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>
  ) {
    super("open", "Open", "");

    this.api = api;
    this.store = store;
  }

  public async action(): Promise<void> {
    await this.api.open();
  }

  public get isDisabled(): boolean {
    return false;
  }
}
