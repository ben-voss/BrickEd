import { DockingLayoutPanelConfig } from "./DockingLayoutPanelConfig";
import { DockingLayoutTabConfig } from "./DockingLayoutTabConfig";

export type OrientationType = "horizontal" | "vertical";

export interface DockingLayoutGroupConfig {
  type: "layoutGroup";
  width: number | null;
  height: number | null;
  orientation: OrientationType;
  items: Array<
    DockingLayoutGroupConfig | DockingLayoutTabConfig | DockingLayoutPanelConfig
  >;
}
