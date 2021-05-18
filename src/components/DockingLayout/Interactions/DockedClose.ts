import { HitTest } from "../HitTest";
import { DockingLayoutData } from "../DockingLayoutData";
import { Interaction } from "./Interaction";
import { GroupProps } from "../Props/GroupProps";
import { PanelProps } from "../Props/PanelProps";

export class DockedClose extends Interaction {
  private _capturedHitStack: HitTest[] | null = null;

  public moveCapture(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number,
    y: number
  ): Interaction {
    if (!this._capturedHitStack) {
      return this;
    }

    const bounds = this._capturedHitStack[0].bounds;

    if (
      x >= bounds.right - 21 &&
      x <= bounds.right - 5 &&
      y >= bounds.top + 5 &&
      y <= bounds.top + 21
    ) {
      (this._capturedHitStack[0].item as PanelProps).closeIsPressed = true;
    } else {
      (this._capturedHitStack[0].item as PanelProps).closeIsPressed = false;
    }

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
    x: number,
    y: number
  ): boolean {
    // Only applies to panels
    if (hitTestStack[0].item.type !== "layoutPanel") {
      return false;
    }

    // Avoid removing the last panel
    if (
      data.group.items.length === 1 &&
      data.group.items[0].type === "layoutPanel"
    ) {
      return false;
    }

    const bounds = hitTestStack[0].bounds;

    if (
      x >= bounds.right - 21 &&
      x <= bounds.right - 5 &&
      y >= bounds.top + 5 &&
      y <= bounds.top + 21
    ) {
      this._capturedHitStack = hitTestStack;

      (hitTestStack[0].item as PanelProps).closeIsPressed = true;
      return true;
    }

    return false;
  }

  public up(data: DockingLayoutData, x: number, y: number): void {
    if (!this._capturedHitStack) {
      return;
    }

    // Only remove if we are really still over the button
    const bounds = this._capturedHitStack[0].bounds;
    if (
      x >= bounds.right - 21 &&
      x <= bounds.right - 5 &&
      y >= bounds.top + 5 &&
      y <= bounds.top + 21
    ) {
      const panelProps = this._capturedHitStack[0].item as PanelProps;
      const groupProps = this._capturedHitStack[1].item as GroupProps;

      // Remove from the group
      const index = groupProps.items.indexOf(panelProps);
      groupProps.items.splice(index, 1);

      // If this leaves the group with only 1 panel it then replace itself with the panel in the parent if there is one
      if (this._capturedHitStack.length > 2 && groupProps.items.length === 1) {
        const parentGroup = this._capturedHitStack[2].item as GroupProps;
        const parentIndex = parentGroup.items.indexOf(groupProps);
        parentGroup.items[parentIndex] = groupProps.items[0];

        groupProps.items[0].width = groupProps.width;
        groupProps.items[0].height = groupProps.height;
      } else if (groupProps.items.length === 1) {
        groupProps.items[0].width = 100;
        groupProps.items[0].height = 100;
      } else {
        // Size the panels to fit
        if (groupProps.orientation === "horizontal") {
          groupProps.items[Math.max(0, index - 1)].width += panelProps.width;
        } else {
          groupProps.items[Math.max(0, index - 1)].height += panelProps.height;
        }
      }
    }

    this._capturedHitStack = null;
  }
}
