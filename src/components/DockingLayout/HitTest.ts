import { FloatingGroupProps } from "./Props/FloatingGroupProps";
import { GroupProps } from "./Props/GroupProps";
import { PanelProps } from "./Props/PanelProps";
import { TabProps } from "./Props/TabProps";
import { Rect } from "./Rect";
import { TabItemProps } from "./Props/TabItemProps";

export interface HitTest {
  bounds: Rect;
  item: FloatingGroupProps | GroupProps | PanelProps | TabProps | TabItemProps;
}
