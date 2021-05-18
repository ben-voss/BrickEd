import { DockingLayoutTabConfig } from "./DockingLayoutTabConfig";
import {
  DockingLayoutGroupConfig,
  OrientationType
} from "./DockingLayoutGroupConfig";
import { DockingLayoutPanelConfig } from "./DockingLayoutPanelConfig";

export interface DockingLayoutFloatingGroupConfig {
  type: "layoutFloatingGroup";
  minWidth: number | undefined;
  minHeight: number | undefined;
  width: number;
  height: number;
  left: number;
  top: number;
  orientation: OrientationType;
  items: Array<
    DockingLayoutGroupConfig | DockingLayoutTabConfig | DockingLayoutPanelConfig
  >;
}
