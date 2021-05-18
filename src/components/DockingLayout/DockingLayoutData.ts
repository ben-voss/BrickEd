import { GroupProps } from "./Props/GroupProps";
import { FloatingGroupProps } from "./Props/FloatingGroupProps";
import { OrientationType } from "./DockingLayoutGroupConfig";

export interface DockingLayoutData {
  group: GroupProps;
  floatingGroups: FloatingGroupProps[];
  cursor: string | null;
  isDocking: boolean;
  isDockingToTab: boolean;
  dockLeft: number;
  dockTop: number;
  isDockShadowVisible: boolean;
  dockShadowLeft: number;
  dockShadowTop: number;
  dockShadowWidth: number;
  dockShadowHeight: number;
  dockGroupTopVisible: boolean;
  dockGroupBottomVisible: boolean;
  dockGroupLeftVisible: boolean;
  dockGroupRightVisible: boolean;
}
