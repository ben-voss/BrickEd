import { HitTest } from "../HitTest";
import { FloatingGroupProps } from "../Props/FloatingGroupProps";
import { Interaction } from "./Interaction";
import { DockingLayoutData } from "../DockingLayoutData";

export class FloatingResize extends Interaction {
  private _capture: string | null = null;
  private _captureItem: HitTest | null = null;

  public moveCapture(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number,
    y: number
  ): Interaction {
    if (!this._capture || !this._captureItem) {
      return this;
    }

    const group = this._captureItem.item as FloatingGroupProps;
    const bounds = this._captureItem.bounds;

    const minWidth = group.minWidth;
    const minHeight = group.minHeight;

    if (this._capture.indexOf("left") !== -1) {
      group.width = Math.max(minWidth, bounds.right - x);
      group.left = bounds.right - group.width;
    }

    if (this._capture.indexOf("top") != -1) {
      group.height = Math.max(minHeight, bounds.bottom - y);
      group.top = bounds.bottom - group.height;
    }

    if (this._capture.indexOf("bottom") != -1) {
      group.height = Math.max(minHeight, y - group.top);
    }

    if (this._capture.indexOf("right") != -1) {
      group.width = Math.max(minWidth, x - group.left);
    }

    return this;
  }

  public moveHover(
    data: DockingLayoutData,
    hitTestStack: HitTest[],
    x: number,
    y: number
  ): void {
    const bounds = hitTestStack[hitTestStack.length - 1].bounds;

    if (
      (x < bounds.left + 5 && y < bounds.top + 5) ||
      (x > bounds.right - 5 && y > bounds.bottom - 5)
    ) {
      // Top Left/BottomRight
      data.cursor = "nwse-resize";
    } else if (
      (x > bounds.right - 5 && y < bounds.top + 5) ||
      (x < bounds.left + 5 && y > bounds.bottom - 5)
    ) {
      // Top Right/Bottom Left
      data.cursor = "nesw-resize";
    } else if (x < bounds.left + 5 || x > bounds.right - 5) {
      // Right/Left
      data.cursor = "ew-resize";
    } else if (y < bounds.top + 5 || y > bounds.bottom - 5) {
      // Top/Bottom
      data.cursor = "ns-resize";
    } else {
      data.cursor = null;
    }
  }

  public down(
    data: DockingLayoutData,
    stack: HitTest[],
    x: number,
    y: number
  ): boolean {
    const bounds = stack[stack.length - 1].bounds;

    if (x < bounds.left + 5 && y < bounds.top + 5) {
      // Top Left
      data.cursor = "nwse-resize";
      this._capture = "top|left";
    } else if (x > bounds.right - 5 && y > bounds.bottom - 5) {
      // BottomRight
      data.cursor = "nwse-resize";
      this._capture = "bottom|right";
    } else if (x > bounds.right - 5 && y < bounds.top + 5) {
      // Top Right
      data.cursor = "nesw-resize";
      this._capture = "top|right";
    } else if (x < bounds.left + 5 && y > bounds.bottom - 5) {
      // Bottom Left
      data.cursor = "nesw-resize";
      this._capture = "bottom|left";
    } else if (x < bounds.left + 5) {
      // Left
      data.cursor = "ew-resize";
      this._capture = "left";
    } else if (x > bounds.right - 5) {
      // Right
      data.cursor = "ew-resize";
      this._capture = "right";
    } else if (y < bounds.top + 5) {
      // Top
      data.cursor = "ns-resize";
      this._capture = "top";
    } else if (y > bounds.bottom - 5) {
      // Bottom
      data.cursor = "ns-resize";
      this._capture = "bottom";
    } else {
      data.cursor = null;
    }

    if (this._capture != null) {
      this._captureItem = stack[stack.length - 1];
    }

    return this._capture != null;
  }

  public up(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number, // eslint-disable-line @typescript-eslint/no-unused-vars
    y: number // eslint-disable-line @typescript-eslint/no-unused-vars
  ): void {
    this._capture = null;
    this._captureItem = null;
  }
}
