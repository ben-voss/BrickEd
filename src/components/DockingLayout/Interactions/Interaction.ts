import { HitTest } from "../HitTest";
import { DockingLayoutData } from "../DockingLayoutData";

export abstract class Interaction {
  public abstract moveCapture(
    data: DockingLayoutData,
    x: number,
    y: number
  ): Interaction;
  public abstract moveHover(
    data: DockingLayoutData,
    hitTestStack: HitTest[],
    x: number,
    y: number
  ): void;
  public abstract down(
    data: DockingLayoutData,
    hitTestStack: HitTest[],
    x: number,
    y: number
  ): boolean;
  public abstract up(data: DockingLayoutData, x: number, y: number): void;
}
