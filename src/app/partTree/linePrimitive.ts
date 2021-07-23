import { Vector3 } from "three";
import Polygon from "../bsp/Polygon";
import LdrColor from "../files/LdrColor";
import LineCommand from "../files/LineCommand";
import Primitive from "./primitive";
import CsgPolygon from "../csg/Polygon";

export default class LinePrimitive implements Primitive {
  private command: LineCommand;
  private color: LdrColor;
  private points: Vector3[];

  constructor(command: LineCommand, color: LdrColor, points: Vector3[]) {
    this.command = command;
    this.color = color;
    this.points = points;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public collectPolygons(polygons: Polygon[]): void {
    // Nop
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public collectCsgPolygons(polygons: CsgPolygon[]): void {
    // Nop
  }
}
