import { Symbols } from "@/di";
import { inject, injectable } from "inversify";
import ColorReference from "./files/ColorReference";
import LdrColor from "./files/LdrColor";
import LdrColorLoader from "./files/LdrColorLoader";
import Settings from "./settings/Settings";

@injectable()
export default class ColorManager {
  private ldrColorLoader: LdrColorLoader;
  private settings: Settings;
  private colorMap!: Map<number, LdrColor>;

  constructor(
    @inject(Symbols.LdrColorLoader) ldrColorLoader: LdrColorLoader,
    @inject(Symbols.Settings) settings: Settings
  ) {
    this.ldrColorLoader = ldrColorLoader;
    this.settings = settings;
  }

  public async resolveColor(colorRef: ColorReference): Promise<LdrColor> {
    if (!this.colorMap) {
      const colors = await this.ldrColorLoader.load(
        this.settings.libraryPath + "LDConfig.ldr"
      );

      // Build a lookup table for the colors so they can be retrieved by code quickly
      this.colorMap = new Map<number, LdrColor>();
      for (const color of colors) {
        this.colorMap.set(color.code, color);
      }
    }

    if (colorRef.num !== undefined) {
      let ldrColor = this.colorMap.get(colorRef.num);
      if (ldrColor === undefined) {
        console.log("ERROR: Undefined color " + colorRef.num);
        ldrColor = this.colorMap.get(0)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
      }

      return ldrColor;
    } else if (colorRef.direct !== undefined) {
      return {
        name: colorRef.direct?.toString(),
        code: -1,
        value: colorRef.direct,
        edge: 0
      };
    } else {
      throw "Unknown color reference " + JSON.stringify(colorRef);
    }
  }
}
