import { DockingLayoutGroupConfig } from "./DockingLayoutGroupConfig";
import { DockingLayoutFloatingGroupConfig } from "./DockingLayoutFloatingGroupConfig";

export interface DockingLayoutConfig {
  group: DockingLayoutGroupConfig;
  floatingGroups: Array<DockingLayoutFloatingGroupConfig> | undefined;
}
