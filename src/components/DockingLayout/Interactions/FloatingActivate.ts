import { Interaction } from "./Interaction";
import { HitTest } from "../HitTest";
import { FloatingGroupProps } from "../Props/FloatingGroupProps";
import { DockingLayoutData } from "../DockingLayoutData";

export class FloatingActivate extends Interaction {
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
    data: DockingLayoutData,
    hitTestStack: HitTest[],
    x: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    y: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): boolean {
    // Find the largest zIndex of all the floating panels.
    let max = 0;
    for (const p of data.floatingGroups) {
      max = Math.max(p.zIndex || 0, max);
    }

    // Set this panel to an even larger zIndex if its not already the largest to ensure its on top
    const floatingGroup = hitTestStack[hitTestStack.length - 1]
      .item as FloatingGroupProps;

    if (floatingGroup.zIndex !== max) {
      // Resequence the zIndexes when max gets too large.  Dont do this all the time because it needs more
      // re-binding work when we change all the zIndexes
      if (max > 1000) {
        const panels = [...data.floatingGroups] as FloatingGroupProps[];
        panels.sort((x, y) => (y.zIndex || 0) - (x.zIndex || 0));
        for (let i = 0; i < panels.length; i++) {
          panels[i].zIndex = i;
        }
        max = panels.length;
      }

      floatingGroup.zIndex = max + 1;
    }

    // Activation never takes the capture
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
