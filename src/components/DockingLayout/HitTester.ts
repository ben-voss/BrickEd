import { HitTest } from "./HitTest";
import { Rect } from "./Rect";
import { GroupProps } from "./Props/GroupProps";
import { TabProps } from "./Props/TabProps";

export class HitTester {
  private static hitTestTab(
    group: TabProps,
    x: number,
    y: number,
    bounds: Rect
  ): HitTest[] {
    let left = bounds.left;
    for (const item of group.items) {
      const width = item.itemWidth; // This is a sync prop and receives the width of the tab header when its bound

      const rect = new Rect(left, bounds.top, width, bounds.height);

      if (rect.contains(x, y)) {
        return [
          {
            bounds: rect,
            item: item
          }
        ];
      } else {
        left += width;
      }
    }

    return [];
  }

  public static hitTestGroup(
    group: GroupProps,
    x: number,
    y: number,
    bounds: Rect
  ): HitTest[] {
    let top = bounds.top;
    let left = bounds.left;

    for (const item of group.items) {
      let rect;
      if (group.orientation === "horizontal") {
        rect = new Rect(
          left,
          top,
          bounds.width * (item.width / 100),
          bounds.height
        );

        left += rect.width;
      } else {
        rect = new Rect(
          left,
          top,
          bounds.width,
          bounds.height * (item.height / 100)
        );

        top += rect.height;
      }

      if (rect.contains(x, y)) {
        if (item.type === "layoutTab") {
          // TODO. Add the tab header
          return this.hitTestTab(item, x, y, rect).concat({
            bounds: rect,
            item: item
          });
        } else if (item.type === "layoutGroup") {
          return this.hitTestGroup(item, x, y, rect).concat({
            bounds: rect,
            item: item
          });
        } else {
          return [
            {
              bounds: rect,
              item: item
            }
          ];
        }
      }
    }

    return [];
  }
}
