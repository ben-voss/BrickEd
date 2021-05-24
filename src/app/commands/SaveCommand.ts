import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import LdrModelWriter from "../files/LdrModelWriter";
import { Store } from "vuex";
import AppState from "@/store/AppState";

@injectable()
export default class SaveCommand extends BaseCommand implements Command {
  private api: Api;
  private readonly store: Store<AppState>;
  private ldrModelWriter: LdrModelWriter;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.LdrModelWriter) ldrModelWriter: LdrModelWriter
  ) {
    super("save", "Save", "");

    this.api = api;
    this.store = store;
    this.ldrModelWriter = ldrModelWriter;

    this.store.watch(
      (state) => state.document.dirty,
      (newValue) => {
        console.log("Save state change:" + newValue);
        window.ipcRenderer.send("MENU", this.id, newValue);
      }
    );
  }

  public get isDisabled(): boolean {
    return !this.store.state.document.dirty;
  }

  public async action(): Promise<void> {
    const fileName = this.store.state.document.fileName;
    const model = this.store.state.document.model;

    const content = this.ldrModelWriter.write(model);

    if (fileName) {
      this.api.save(fileName, content, "ldr");
    } else {
      const fileName = await this.api.saveAs(content, "ldr");

      if (fileName) {
        this.api.setRepresentedFilename(fileName);
      }
    }
  }
}
