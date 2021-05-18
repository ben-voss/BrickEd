import { HitTest } from "../HitTest";
import { DockingLayoutData } from "../DockingLayoutData";
import { Interaction } from "./Interaction";
import { FloatingGroupProps } from "../Props/FloatingGroupProps";
import { PanelProps } from "../Props/PanelProps";

export class FloatingClose extends Interaction {
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
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    hitTestStack: HitTest[],
    x: number,
    y: number
  ): boolean {
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
      const index = data.floatingGroups.indexOf(
        this._capturedHitStack[this._capturedHitStack.length - 1]
          .item as FloatingGroupProps
      );
      data.floatingGroups.splice(index, 1);
    }

    this._capturedHitStack = null;
  }
}
