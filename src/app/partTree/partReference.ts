import Polygon from "../bsp/Polygon";
import PartCommand from "../files/PartCommand";
import PartPrimitives from "./PartPrimitives";
import Primitive from "./primitive";
import CsgPolygon from "../csg/Polygon";

export default class PartReference implements Primitive {
  private command: PartCommand;
  private part: PartPrimitives;

  constructor(command: PartCommand, part: PartPrimitives) {
    this.command = command;
    this.part = part;
  }

  public collectPolygons(polygons: Polygon[]): void {
    this.part.collectPolygons(polygons);
  }

  public collectCsgPolygons(polygons: CsgPolygon[]): void {
    this.part.collectCsgPolygons(polygons);
  }
}
