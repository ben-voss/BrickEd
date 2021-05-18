import { Vector2 } from "three";
import { HitTest } from "../HitTest";
import { Interaction } from "./Interaction";
import { FloatingGroupProps } from "../Props/FloatingGroupProps";
import { GroupProps } from "../Props/GroupProps";
import { PanelProps } from "../Props/PanelProps";
import { FloatingMove } from "./FloatingMove";
import { FloatingActivate } from "./FloatingActivate";
import { DockingLayoutData } from "../DockingLayoutData";

export class DockedMove extends Interaction {
  private _rootElement: HTMLDivElement;

  private _captureXOffset: number | null = null;
  private _captureYOffset: number | null = null;
  private _captureX: number | null = null;
  private _captureY: number | null = null;
  private _stack: HitTest[] | null = null;

  constructor(rootElement: HTMLDivElement) {
    super();

    this._rootElement = rootElement;
  }

  public moveCapture(
    data: DockingLayoutData,
    x: number,
    y: number
  ): Interaction {
    if (
      !this._stack ||
      !this._captureX ||
      !this._captureY ||
      !this._captureXOffset ||
      !this._captureYOffset
    ) {
      return this;
    }

    // Need to move 5 pixels before we undock
    if (
      new Vector2(this._captureX, this._captureY).distanceTo(
        new Vector2(x, y)
      ) <= 5
    ) {
      data.cursor = null;
      return this;
    }

    const panelProps = this._stack[0].item as PanelProps;
    const groupProps = this._stack[1].item as GroupProps;

    // Ignore when there is just one panel in one group
    if (this._stack.length === 2 && groupProps.items.length === 1) {
      return this;
    }

    // Remove from the group
    const index = groupProps.items.indexOf(panelProps);
    groupProps.items.splice(index, 1);

    // If this leaves the group with only 1 panel it then replace itself with the panel in the parent if there is one
    if (this._stack.length > 2 && groupProps.items.length === 1) {
      const parentGroup = this._stack[2].item as GroupProps;
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

    // Translate the bounds by the pointer movement
    const panelBounds = this._stack[0].bounds;
    panelBounds.left = x - this._captureXOffset;
    panelBounds.top = y - this._captureYOffset;

    // Create a floating group for the panel we are undocking
    const floatingGroupProps: FloatingGroupProps = {
      type: "floatingGroup",
      group: {
        type: "layoutGroup",
        orientation: "horizontal",
        items: [panelProps],
        width: 100,
        height: 100,
        isSizerVisible: false,
        sizerPosition: 0
      },
      left: panelBounds.left,
      top: panelBounds.top,
      width: panelBounds.width,
      height: panelBounds.height,
      zIndex: 1,
      minWidth: 30,
      minHeight: 20
    };

    // Ensure the panel will fill the group
    panelProps.width = 100;
    panelProps.height = 100;

    data.floatingGroups.push(floatingGroupProps);

    // Use the activate interaction to ensure the correct z-index
    new FloatingActivate().down(
      data,
      [{ item: floatingGroupProps, bounds: panelBounds }],
      x,
      y
    );

    // Chain off to the floating move interation
    const nextInteraction = FloatingMove.fromUndock(
      this._rootElement,
      data,
      this._captureXOffset,
      this._captureYOffset,
      floatingGroupProps
    );

    this._stack = null;
    this._captureX = null;
    this._captureY = null;
    this._captureXOffset = null;
    this._captureYOffset = null;

    return nextInteraction;
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

    // Take the capture when the title bar is hit
    if (y < bounds.top + 24) {
      const captureItem = hitTestStack[0];

      this._stack = hitTestStack;
      this._captureX = x;
      this._captureY = y;
      this._captureXOffset = x - captureItem.bounds.left;
      this._captureYOffset = y - captureItem.bounds.top;

      return true;
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
