import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import LdrModelWriter from "../files/LdrModelWriter";

@injectable()
export default class SaveCommand extends BaseCommand implements Command {
  private api: Api;
  private ldrModelWriter: LdrModelWriter;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.LdrModelWriter) ldrModelWriter: LdrModelWriter
  ) {
    super("save", "Save", "");

    this.api = api;
    this.ldrModelWriter = ldrModelWriter;
  }

  public get isDisabled(): boolean {
    return false;
  }

  private getFileName() {
    return "";
  }

  private getModel() {
    return [];
  }

  public async action(): Promise<void> {
    const fileName = this.getFileName();
    const model = this.getModel();

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
