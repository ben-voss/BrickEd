import { HitTest } from "../HitTest";
import { DockingLayoutData } from "../DockingLayoutData";
import { Interaction } from "./Interaction";
import { TabProps } from "../Props/TabProps";

export class TabSelection extends Interaction {
  public moveCapture(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    y: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): Interaction {
    return this;
  }

  public moveHover(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    hitTestStack: HitTest[], // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    y: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    //
  }

  public down(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    hitTestStack: HitTest[],
    x: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    y: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): boolean {
    if (hitTestStack[0].item.type === "layoutTabItem") {
      const tabProps = hitTestStack[1].item as TabProps;
      tabProps.selectedItem = hitTestStack[0].item;
    }

    return false;
  }

  public up(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    y: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    //
  }
}
