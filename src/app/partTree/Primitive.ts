import Polygon from "../bsp/Polygon";
import CsgPolygon from "../csg/Polygon";

export default interface Primitive {
  collectPolygons(polygons: Polygon[]): void;
  collectCsgPolygons(polygons: CsgPolygon[]): void;
}
