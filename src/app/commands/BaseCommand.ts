import { IpcRendererEvent } from "electron";
import { unmanaged } from "inversify";

export default abstract class BaseCommand {
  public id: string;
  public title: string;
  public icon: string;

  constructor(
    @unmanaged() id: string,
    @unmanaged() title: string,
    @unmanaged() icon: string
  ) {
    this.id = id;
    this.title = title;
    this.icon = icon;

    window.ipcRenderer.on(
      "menu." + this.id,
      (event: IpcRendererEvent, ...args: string[]) => {
        this.ipcRendererAction(args);
      }
    );
  }

  public get disabled(): boolean {
    return this.isDisabled;
  }

  protected abstract get isDisabled(): boolean;

  protected abstract action(): void;

  protected ipcRendererAction(args: string[]): void {
    this.action();
  }
}
