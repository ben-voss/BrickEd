import { OrientationType } from "../DockingLayoutGroupConfig";
import { PanelProps } from "./PanelProps";
import { TabProps } from "./TabProps";

export interface GroupProps {
  type: "layoutGroup";
  orientation: OrientationType;
  items: (PanelProps | TabProps | GroupProps)[];
  width: number;
  height: number;
  isSizerVisible: boolean;
  sizerPosition: number;
}
