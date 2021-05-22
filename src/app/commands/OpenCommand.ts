import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import LdrModelLoader from "../files/LdrModelLoader";

@injectable()
export default class OpenCommand extends BaseCommand implements Command {
  private readonly api: Api;
  private readonly ldrModelLoader: LdrModelLoader;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.LdrModelLoader) ldrModelLoader: LdrModelLoader
  ) {
    super("open", "Open", "");

    this.api = api;
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
    const models = await this.ldrModelLoader.loadString(fileName, content);

    console.log(models.length);
  }

  public get isDisabled(): boolean {
    return false;
  }
}
