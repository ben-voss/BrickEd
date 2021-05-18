import { TabItemProps } from "./TabItemProps";

export interface TabProps {
  type: "layoutTab";
  items: TabItemProps[];
  width: number;
  height: number;
  selectedItem: TabItemProps;
}
