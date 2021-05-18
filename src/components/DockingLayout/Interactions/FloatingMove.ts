import { HitTest } from "../HitTest";
import { Interaction } from "./Interaction";
import { FloatingGroupProps } from "../Props/FloatingGroupProps";
import { HitTester } from "../HitTester";
import { Rect } from "../Rect";
import { GroupProps } from "../Props/GroupProps";
import { DockingLayoutData } from "../DockingLayoutData";
import { PanelProps } from "../Props/PanelProps";

export class FloatingMove extends Interaction {
  private _rootElement: HTMLDivElement;

  private _captureXOffset: number | null = null;
  private _captureYOffset: number | null = null;
  private _group: FloatingGroupProps | null = null;

  constructor(rootElement: HTMLDivElement) {
    super();

    this._rootElement = rootElement;
  }

  public static fromUndock(
    rootElement: HTMLDivElement,
    data: DockingLayoutData,
    captureXOffset: number,
    captureYOffset: number,
    floatingGroup: FloatingGroupProps
  ): FloatingMove {
    const m = new FloatingMove(rootElement);
    m._captureXOffset = captureXOffset;
    m._captureYOffset = captureYOffset;
    m._group = floatingGroup;
    data.isDocking = true;

    m.moveCapture(
      data,
      floatingGroup.left + captureXOffset,
      floatingGroup.top + captureYOffset
    );
    return m;
  }

  public moveCapture(
    data: DockingLayoutData,
    x: number,
    y: number
  ): Interaction {
    if (!this._group || !this._captureXOffset || !this._captureYOffset) {
      return this;
    }

    data.cursor = "move";
    this._group.left = x - this._captureXOffset;
    this._group.top = y - this._captureYOffset;

    // Work out which panel we are now hovering over
    const bounds = Rect.fromDOMRect(this._rootElement.getBoundingClientRect());
    const stack = HitTester.hitTestGroup(data.group, x, y, bounds).concat({
      bounds: bounds,
      item: data.group
    });

    if (stack.length === 0) {
      return this;
    }

    // Position the docking hotspots
    const panelBounds = stack[0].bounds;
    const cx = panelBounds.left + panelBounds.width / 2;
    const cy = panelBounds.top + panelBounds.height / 2;
    data.dockLeft = cx;
    data.dockTop = cy;

    // Work out which pair of outside edge dockers to show.  The group hovers are visible
    // when the first or last item in the root group is not a panel and when the
    // orientation != docking hovers top/bottom or left/right location
    const group = stack[stack.length - 1].item as GroupProps;
    if (group.orientation === "horizontal") {
      data.dockGroupTopVisible = true;
      data.dockGroupBottomVisible = true;
      data.dockGroupRightVisible =
        group.items[group.items.length - 1].type === "layoutGroup";
      data.dockGroupLeftVisible = group.items[0].type === "layoutGroup";
    } else {
      data.dockGroupTopVisible = group.items[0].type === "layoutGroup";
      data.dockGroupBottomVisible =
        group.items[group.items.length - 1].type === "layoutGroup";
      data.dockGroupRightVisible = true;
      data.dockGroupLeftVisible = true;
    }

    // Position the docking shadow if hovering over a hotspot
    if (new Rect(cx - 25, cy - 75, 50, 50).contains(x, y)) {
      // Panel Top
      data.dockShadowLeft = panelBounds.left;
      data.dockShadowTop = panelBounds.top;
      data.dockShadowWidth = panelBounds.width;
      data.dockShadowHeight = panelBounds.height / 2;
      data.isDockShadowVisible = true;
    } else if (new Rect(cx - 25, cy + 25, 50, 50).contains(x, y)) {
      // Panel Bottom
      data.dockShadowLeft = panelBounds.left;
      data.dockShadowTop = panelBounds.top + panelBounds.height / 2;
      data.dockShadowWidth = panelBounds.width;
      data.dockShadowHeight = panelBounds.height / 2;
      data.isDockShadowVisible = true;
    } else if (new Rect(cx - 75, cy - 25, 50, 50).contains(x, y)) {
      // Panel Left
      data.dockShadowLeft = panelBounds.left;
      data.dockShadowTop = panelBounds.top;
      data.dockShadowWidth = panelBounds.width / 2;
      data.dockShadowHeight = panelBounds.height;
      data.isDockShadowVisible = true;
    } else if (new Rect(cx + 25, cy - 25, 50, 50).contains(x, y)) {
      // Panel right
      data.dockShadowLeft = panelBounds.left + panelBounds.width / 2;
      data.dockShadowTop = panelBounds.top;
      data.dockShadowWidth = panelBounds.width / 2;
      data.dockShadowHeight = panelBounds.height;
      data.isDockShadowVisible = true;
    } else if (
      (group.orientation === "horizontal" ||
        (group.orientation === "vertical" &&
          group.items[0].type === "layoutGroup")) &&
      new Rect(bounds.width / 2 - 25, 25, 50, 50).contains(x, y)
    ) {
      // Group Top
      data.dockShadowLeft = bounds.left;
      data.dockShadowTop = bounds.top;
      data.dockShadowWidth = bounds.width;
      data.dockShadowHeight = bounds.height / 3;
      data.isDockShadowVisible = true;
    } else if (
      (group.orientation === "horizontal" ||
        (group.orientation === "vertical" &&
          group.items[group.items.length - 1].type === "layoutGroup")) &&
      new Rect(bounds.width / 2 - 25, bounds.height - 75, 50, 50).contains(x, y)
    ) {
      // Group Bottom
      data.dockShadowLeft = bounds.left;
      data.dockShadowTop = bounds.top + bounds.height / 1.5;
      data.dockShadowWidth = bounds.width;
      data.dockShadowHeight = bounds.height / 3;
      data.isDockShadowVisible = true;
    } else if (
      (group.orientation === "vertical" ||
        (group.orientation === "horizontal" &&
          group.items[0].type === "layoutGroup")) &&
      new Rect(25, bounds.height / 2 - 25, 50, 50).contains(x, y)
    ) {
      // Group Left
      data.dockShadowLeft = bounds.left;
      data.dockShadowTop = bounds.top;
      data.dockShadowWidth = bounds.width / 3;
      data.dockShadowHeight = bounds.height;
      data.isDockShadowVisible = true;
    } else if (
      (group.orientation === "vertical" ||
        (group.orientation === "horizontal" &&
          group.items[group.items.length - 1].type === "layoutGroup")) &&
      new Rect(bounds.width - 75, bounds.height / 2 - 25, 50, 50).contains(x, y)
    ) {
      // Group Right
      data.dockShadowLeft = bounds.left + bounds.width / 1.5;
      data.dockShadowTop = bounds.top;
      data.dockShadowWidth = bounds.width / 3;
      data.dockShadowHeight = bounds.height;
      data.isDockShadowVisible = true;
    } else {
      data.isDockShadowVisible = false;
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
    const bounds = hitTestStack[0].bounds;

    if (y < bounds.top + 24) {
      const captureItem = hitTestStack[hitTestStack.length - 1];
      this._group = captureItem.item as FloatingGroupProps;

      this._captureXOffset = x - bounds.left;
      this._captureYOffset = y - bounds.top;
      data.cursor = "move";
      data.isDocking = true;

      this.moveCapture(data, x, y);
      return true;
    }

    return false;
  }

  public up(data: DockingLayoutData, x: number, y: number): void {
    if (!this._group) {
      return;
    }

    data.cursor = null;
    data.isDocking = false;
    data.isDockShadowVisible = false;
    data.dockGroupTopVisible = false;
    data.dockGroupBottomVisible = false;
    data.dockGroupRightVisible = false;
    data.dockGroupLeftVisible = false;

    // Work out which panel we are now hovering over
    const bounds = Rect.fromDOMRect(this._rootElement.getBoundingClientRect());
    const stack = HitTester.hitTestGroup(data.group, x, y, bounds).concat({
      bounds: bounds,
      item: data.group
    });

    if (stack.length === 0) {
      return;
    }

    // Position the docking hotspots
    const panelBounds = stack[0].bounds;
    const cx = panelBounds.left + panelBounds.width / 2;
    const cy = panelBounds.top + panelBounds.height / 2;
    const group = stack[stack.length - 1].item as GroupProps;

    // Position the docking shadow if hovering over a hotspot
    if (new Rect(cx - 25, cy - 75, 50, 50).contains(x, y)) {
      // Panel Top

      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const group = stack[1].item as GroupProps;
      const existingPanel = stack[0].item as PanelProps;
      const newPanel = this._group.group.items[0] as PanelProps;
      const existingPanelIndex = group.items.indexOf(existingPanel);

      if (group.orientation === "horizontal") {
        // Create a new group
        const newGroup: GroupProps = {
          type: "layoutGroup",
          orientation: "vertical",
          items: [newPanel, existingPanel],
          width: existingPanel.width,
          height: existingPanel.height,
          isSizerVisible: false,
          sizerPosition: 0
        };

        // Replace the existing panel with the new group
        group.items.splice(existingPanelIndex, 1, newGroup);

        // Fix the width of the existing panel
        existingPanel.width = 100;
      } else {
        // Add the new panel just before the existing
        group.items.splice(existingPanelIndex, 0, newPanel);
      }

      // Spilt the heights of the two panels
      const h = existingPanel.height / 2;
      existingPanel.height = h;
      newPanel.height = h;
    } else if (new Rect(cx - 25, cy + 25, 50, 50).contains(x, y)) {
      // Panel Bottom

      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const group = stack[1].item as GroupProps;
      const existingPanel = stack[0].item as PanelProps;
      const newPanel = this._group.group.items[0] as PanelProps;
      const existingPanelIndex = group.items.indexOf(existingPanel);

      if (group.orientation === "horizontal") {
        // Create a new group
        const newGroup: GroupProps = {
          type: "layoutGroup",
          orientation: "vertical",
          items: [existingPanel, newPanel],
          width: existingPanel.width,
          height: existingPanel.height,
          isSizerVisible: false,
          sizerPosition: 0
        };

        // Replace the existing panel with the new group
        group.items.splice(existingPanelIndex, 1, newGroup);

        // Fix the width of the existing panel
        existingPanel.width = 100;
      } else {
        // Add the new panel just after the existing
        group.items.splice(existingPanelIndex + 1, 0, newPanel);
      }

      // Spilt the heights of the two panels
      const h = existingPanel.height / 2;
      existingPanel.height = h;
      newPanel.height = h;
    } else if (new Rect(cx - 75, cy - 25, 50, 50).contains(x, y)) {
      // Panel Left

      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const group = stack[1].item as GroupProps;
      const existingPanel = stack[0].item as PanelProps;
      const newPanel = this._group.group.items[0] as PanelProps;
      const existingPanelIndex = group.items.indexOf(existingPanel);

      if (group.orientation === "vertical") {
        // Create a new group
        const newGroup: GroupProps = {
          type: "layoutGroup",
          orientation: "horizontal",
          items: [newPanel, existingPanel],
          width: existingPanel.width,
          height: existingPanel.height,
          isSizerVisible: false,
          sizerPosition: 0
        };

        // Replace the existing panel with the new group
        group.items.splice(existingPanelIndex, 1, newGroup);

        // Fix the height of the existing panel
        existingPanel.height = 100;
      } else {
        // Add the new panel just before the existing
        group.items.splice(existingPanelIndex, 0, newPanel);
      }

      // Spilt the widths of the two panels
      const w = existingPanel.width / 2;
      existingPanel.width = w;
      newPanel.width = w;
    } else if (new Rect(cx + 25, cy - 25, 50, 50).contains(x, y)) {
      // Panel right
      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const group = stack[1].item as GroupProps;
      const existingPanel = stack[0].item as PanelProps;
      const newPanel = this._group.group.items[0] as PanelProps;
      const existingPanelIndex = group.items.indexOf(existingPanel);

      if (group.orientation === "vertical") {
        // Create a new group
        const newGroup: GroupProps = {
          type: "layoutGroup",
          orientation: "horizontal",
          items: [existingPanel, newPanel],
          width: existingPanel.width,
          height: existingPanel.height,
          isSizerVisible: false,
          sizerPosition: 0
        };

        // Replace the existing panel with the new group
        group.items.splice(existingPanelIndex, 1, newGroup);

        // Fix the height of the existing panel
        existingPanel.height = 100;
      } else {
        // Add the new panel just after the existing
        group.items.splice(existingPanelIndex + 1, 0, newPanel);
      }

      // Spilt the widths of the two panels
      const w = existingPanel.width / 2;
      existingPanel.width = w;
      newPanel.width = w;
    } else if (
      (group.orientation === "horizontal" ||
        (group.orientation === "vertical" &&
          group.items[0].type === "layoutGroup")) &&
      new Rect(bounds.width / 2 - 25, 25, 50, 50).contains(x, y)
    ) {
      // Group Top

      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const existingGroup = data.group;
      const newPanel = this._group.group.items[0] as PanelProps;

      // Create a new group
      // Replace the existing panel with the new group
      data.group = {
        type: "layoutGroup",
        orientation: "vertical",
        items: [newPanel, existingGroup],
        width: data.group.width,
        height: data.group.height,
        isSizerVisible: false,
        sizerPosition: 0
      };

      // Spilt the heights of the two panels
      existingGroup.height = 67;
      newPanel.height = 33;
    } else if (
      (group.orientation === "horizontal" ||
        (group.orientation === "vertical" &&
          group.items[group.items.length - 1].type === "layoutGroup")) &&
      new Rect(bounds.width / 2 - 25, bounds.height - 75, 50, 50).contains(x, y)
    ) {
      // Group Bottom

      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const existingGroup = data.group;
      const newPanel = this._group.group.items[0] as PanelProps;

      // Create a new group
      // Replace the existing panel with the new group
      data.group = {
        type: "layoutGroup",
        orientation: "vertical",
        items: [existingGroup, newPanel],
        width: data.group.width,
        height: data.group.height,
        isSizerVisible: false,
        sizerPosition: 0
      };

      // Spilt the heights of the two panels
      existingGroup.height = 67;
      newPanel.height = 33;
    } else if (
      (group.orientation === "vertical" ||
        (group.orientation === "horizontal" &&
          group.items[0].type === "layoutGroup")) &&
      new Rect(25, bounds.height / 2 - 25, 50, 50).contains(x, y)
    ) {
      // Group Left

      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const existingGroup = data.group;
      const newPanel = this._group.group.items[0] as PanelProps;

      // Create a new group
      // Replace the existing panel with the new group
      data.group = {
        type: "layoutGroup",
        orientation: "horizontal",
        items: [newPanel, existingGroup],
        width: data.group.width,
        height: data.group.height,
        isSizerVisible: false,
        sizerPosition: 0
      };

      // Spilt the widths of the two panels
      existingGroup.width = 67;
      newPanel.width = 33;
    } else if (
      (group.orientation === "vertical" ||
        (group.orientation === "horizontal" &&
          group.items[group.items.length - 1].type === "layoutGroup")) &&
      new Rect(bounds.width - 75, bounds.height / 2 - 25, 50, 50).contains(x, y)
    ) {
      // Group Right

      // Remove floating group
      const index = data.floatingGroups.indexOf(this._group);
      data.floatingGroups.splice(index, 1);

      // Add the panel into its new group
      const existingGroup = data.group;
      const newPanel = this._group.group.items[0] as PanelProps;

      // Create a new group
      // Replace the existing panel with the new group
      data.group = {
        type: "layoutGroup",
        orientation: "horizontal",
        items: [existingGroup, newPanel],
        width: data.group.width,
        height: data.group.height,
        isSizerVisible: false,
        sizerPosition: 0
      };

      // Spilt the widths of the two panels
      existingGroup.width = 67;
      newPanel.width = 33;

      // Clear the capture state
      this._captureXOffset = null;
      this._captureYOffset = null;
      this._group = null;
    }
  }
}
