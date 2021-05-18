import { DockingLayoutPanelConfig } from "./DockingLayoutPanelConfig";

export interface DockingLayoutTabConfig {
  type: "layoutTab";
  width: number | null;
  height: number | null;
  items: Array<DockingLayoutPanelConfig>;
  selectedIndex: number | null;
}
