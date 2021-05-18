export interface DockingLayoutPanelConfig {
  type: "layoutPanel";
  title: string;
  width: number | null;
  height: number | null;
  slot: string;
}
