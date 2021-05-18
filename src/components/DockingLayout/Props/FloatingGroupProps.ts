import { GroupProps } from "./GroupProps";

export interface FloatingGroupProps {
  type: "floatingGroup";
  group: GroupProps;
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number | null;
  minWidth: number;
  minHeight: number;
}
