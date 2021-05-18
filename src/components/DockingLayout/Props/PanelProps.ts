export interface PanelProps {
  type: "layoutPanel";
  title: string;
  slot: string;
  width: number;
  height: number;
  closeIsPressed: boolean;
}
