import { HitTest } from "../HitTest";
import { GroupProps } from "../Props/GroupProps";
import { PanelProps } from "../Props/PanelProps";
import { Interaction } from "./Interaction";
import { DockingLayoutData } from "../DockingLayoutData";

export class DockedResize extends Interaction {
  private minWidth = 50;
  private minHeight = 30;

  // Index of the 'left' panel being sized when re-sizing panels
  private _sizePanelIndex: number | null = null;

  // Hit-test stack when captureing pointer events
  private _captureGroup: HitTest | null = null;

  public moveCapture(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number,
    y: number
  ): Interaction {
    if (
      !this._captureGroup ||
      this._sizePanelIndex === null ||
      this._sizePanelIndex === undefined
    ) {
      return this;
    }

    const group = this._captureGroup.item as GroupProps;
    const groupBounds = this._captureGroup.bounds;

    if (group.orientation === "horizontal") {
      // Limit the minimum size of the left panel
      let leftSum = 0;
      for (let i = 0; i < this._sizePanelIndex; i++) {
        leftSum += group.items[i].width;
      }

      const leftEdge = (groupBounds.width / 100) * leftSum + groupBounds.left;
      if (x - leftEdge < this.minWidth) {
        x = leftEdge + this.minWidth;
      }

      // Limit the minimum size of the right panel
      let rightSum = 0;
      for (let i = this._sizePanelIndex + 2; i < group.items.length; i++) {
        rightSum += group.items[i].width;
      }

      const rightEdge =
        groupBounds.width -
        (groupBounds.width / 100) * rightSum +
        groupBounds.left;
      if (rightEdge - x < this.minWidth) {
        x = rightEdge - this.minWidth;
      }

      group.sizerPosition = x - 2 - this._captureGroup.bounds.left;
    } else {
      // Limit the minimum size to the left
      let topSum = 0;
      for (let i = 0; i < this._sizePanelIndex; i++) {
        topSum += group.items[i].height;
      }

      const topEdge = (groupBounds.height / 100) * topSum + groupBounds.top;
      if (y - topEdge < this.minHeight) {
        y = topEdge + this.minHeight;
      }

      // Limit the minimum size of the right
      let rightSum = 0;
      for (let i = this._sizePanelIndex + 2; i < group.items.length; i++) {
        rightSum += group.items[i].height;
      }

      const rightEdge =
        groupBounds.height -
        (groupBounds.height / 100) * rightSum +
        groupBounds.top;
      if (rightEdge - y < this.minHeight) {
        y = rightEdge - this.minHeight;
      }

      group.sizerPosition = y - 2 - this._captureGroup.bounds.top;
    }

    return this;
  }

  public moveHover(
    data: DockingLayoutData,
    hitTestStack: HitTest[],
    x: number,
    y: number
  ): void {
    // When a tab item is hit we pop the stack 1 level to deal with the whole tab panel
    if (hitTestStack[0].item.type === "layoutTabItem") {
      hitTestStack.shift();
    }

    // Check for panel re-sizing
    const panelBounds = hitTestStack[0].bounds;
    const groupBounds = hitTestStack[hitTestStack.length - 1].bounds;

    if (
      x < groupBounds.left + 5 ||
      x > groupBounds.right - 5 ||
      y < groupBounds.top + 5 ||
      y > groupBounds.bottom - 5
    ) {
      data.cursor = null;
    } else if (x < panelBounds.left + 5 || x > panelBounds.right - 5) {
      data.cursor = "col-resize";
    } else if (y < panelBounds.top + 5 || y > panelBounds.bottom - 5) {
      data.cursor = "row-resize";
    } else {
      data.cursor = null;
    }
  }

  public down(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    hitTestStack: HitTest[],
    x: number,
    y: number
  ): boolean {
    // When a tab item is hit we pop the stack 1 level to deal with the whole tab panel
    if (hitTestStack[0].item.type === "layoutTabItem") {
      hitTestStack.shift();
    }

    const panelBounds = hitTestStack[0].bounds;

    let panel = hitTestStack[0].item as PanelProps | GroupProps;
    let group = hitTestStack[1].item as GroupProps;
    let index = group.items.indexOf(panel);

    if (x >= panelBounds.left && x < panelBounds.left + 5) {
      while (index === 0 || group.orientation !== "horizontal") {
        if (hitTestStack.length < 3) {
          return false;
        }

        hitTestStack.shift();
        panel = hitTestStack[0].item as GroupProps;
        group = hitTestStack[1].item as GroupProps;
        index = group.items.indexOf(panel);
      }

      group.sizerPosition = x - 2 - hitTestStack[1].bounds.left;
      this._sizePanelIndex = index - 1;
    } else if (x <= panelBounds.right && x > panelBounds.right - 5) {
      while (
        index === group.items.length - 1 ||
        group.orientation !== "horizontal"
      ) {
        if (hitTestStack.length < 3) {
          return false;
        }

        hitTestStack.shift();
        panel = hitTestStack[0].item as GroupProps;
        group = hitTestStack[1].item as GroupProps;
        index = group.items.indexOf(panel);
      }

      group.sizerPosition = x - 2 - hitTestStack[1].bounds.left;
      this._sizePanelIndex = index;
    } else if (y >= panelBounds.top && y < panelBounds.top + 5) {
      while (index === 0 || group.orientation !== "vertical") {
        if (hitTestStack.length < 3) {
          return false;
        }

        hitTestStack.shift();
        panel = hitTestStack[0].item as GroupProps;
        group = hitTestStack[1].item as GroupProps;
        index = group.items.indexOf(panel);
      }

      group.sizerPosition = y - 2 - hitTestStack[1].bounds.top;
      this._sizePanelIndex = index - 1;
    } else if (y <= panelBounds.bottom && y > panelBounds.bottom - 5) {
      while (
        index === group.items.length - 1 ||
        group.orientation !== "vertical"
      ) {
        if (hitTestStack.length < 3) {
          return false;
        }

        hitTestStack.shift();
        panel = hitTestStack[0].item as GroupProps;
        group = hitTestStack[1].item as GroupProps;
        index = group.items.indexOf(panel);
      }
      group.sizerPosition = y - 2 - hitTestStack[1].bounds.top;
      this._sizePanelIndex = index;
    } else {
      // Not hit the edge of any panel
      return false;
    }

    group.isSizerVisible = true;
    this._captureGroup = hitTestStack[1];
    return true;
  }

  public up(
    data: DockingLayoutData, // eslint-disable-line @typescript-eslint/no-unused-vars
    x: number,
    y: number
  ): void {
    if (!this._captureGroup) {
      return;
    }

    if (this._sizePanelIndex === null) {
      return;
    }

    console.assert(this._sizePanelIndex >= 0);

    const group = this._captureGroup.item as GroupProps;
    const groupBounds = this._captureGroup.bounds;

    const leftProps = group.items[this._sizePanelIndex];
    const rightProps = group.items[this._sizePanelIndex + 1];

    if (group.orientation === "horizontal") {
      // Limit the minimum size
      let leftSum = 0;
      for (let i = 0; i < this._sizePanelIndex; i++) {
        leftSum += group.items[i].width;
      }

      const leftEdge = (groupBounds.width / 100) * leftSum + groupBounds.left;
      if (x - leftEdge < this.minWidth) {
        x = leftEdge + this.minWidth;
      }

      // Limit the minimum size of the right panel
      let rightSum = 0;
      for (let i = this._sizePanelIndex + 2; i < group.items.length; i++) {
        rightSum += group.items[i].width;
      }

      const rightEdge =
        groupBounds.width -
        (groupBounds.width / 100) * rightSum +
        groupBounds.left;
      if (rightEdge - x < this.minWidth) {
        x = rightEdge - this.minWidth;
      }

      x -= this._captureGroup.bounds.left;

      const total = leftProps.width + rightProps.width;
      const left = (x / groupBounds.width) * 100 - leftSum;

      leftProps.width = left;
      rightProps.width = total - left;
    } else {
      // Limit the minimum size of the size to the left
      let leftSum = 0;
      for (let i = 0; i < this._sizePanelIndex; i++) {
        leftSum += group.items[i].height;
      }

      const topEdge = (groupBounds.height / 100) * leftSum + groupBounds.top;
      if (y - topEdge < this.minHeight) {
        y = topEdge + this.minHeight;
      }

      // Limit the minimum size of the right
      let rightSum = 0;
      for (let i = this._sizePanelIndex + 2; i < group.items.length; i++) {
        rightSum += group.items[i].height;
      }

      const rightEdge =
        groupBounds.height -
        (groupBounds.height / 100) * rightSum +
        groupBounds.top;
      if (rightEdge - y < this.minHeight) {
        y = rightEdge - this.minHeight;
      }

      y -= this._captureGroup.bounds.top;

      const total = leftProps.height + rightProps.height;
      const left = (y / groupBounds.height) * 100 - leftSum;

      leftProps.height = left;
      rightProps.height = total - left;
    }

    group.isSizerVisible = false;

    this._sizePanelIndex = null;
    this._captureGroup = null;
  }
}
