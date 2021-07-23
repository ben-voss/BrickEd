import Polygon from "../bsp/Polygon";
import Primitive from "./primitive";
import CsgPolygon from "../csg/Polygon";

export default class PartPrimitives implements Primitive {
  public readonly name: string;
  public readonly primitives: Primitive[];

  constructor(name: string, primitives: Primitive[]) {
    this.name = name;
    this.primitives = primitives;
  }

  public collectPolygons(polygons: Polygon[]): void {
    for (const p of this.primitives) {
      p.collectPolygons(polygons);
    }
  }

  public collectCsgPolygons(polygons: CsgPolygon[]): void {
    for (const p of this.primitives) {
      p.collectCsgPolygons(polygons);
    }
  }
}
