import LdrColor from "./LdrColor";
import * as LdrColorGrammar from "./LdrColorGrammar";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";

@injectable()
export default class LdrColorLoader {
  private readonly api: Api;

  constructor(@inject(Symbols.Api) api: Api) {
    this.api = api;
  }

  public async load(fileName: string): Promise<LdrColor[]> {
    const result = await this.api.readFileAsync(fileName);

    // Parse the data
    const colors = LdrColorGrammar.parse(result) as LdrColor[];

    // Filter out all the comment rows
    return colors.filter((c) => c.code !== undefined);
  }
}
