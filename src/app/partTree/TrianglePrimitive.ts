import { Triangle, Vector2, Vector3 } from "three";
import Polygon from "../bsp/Polygon";
import Vertex from "../bsp/Vertex";
import LdrColor from "../files/LdrColor";
import TriangleCommand from "../files/TriangleCommand";
import Primitive from "./Primitive";
import CsgPolygon from "../csg/Polygon";
import CsgVertex from "../csg/Vertex";
import Vector from "../csg/Vector";

export default class TrianglePrimitive implements Primitive {
  private command: TriangleCommand;
  private color: LdrColor;
  private triangle: Triangle;

  constructor(command: TriangleCommand, color: LdrColor, triangle: Triangle) {
    this.command = command;
    this.color = color;
    this.triangle = triangle;
  }

  public collectPolygons(polygons: Polygon[]): void {
    const vector1 = new Vector3().subVectors(this.triangle.b, this.triangle.a);
    const vector2 = new Vector3().subVectors(this.triangle.c, this.triangle.a);
    const normal = new Vector3().crossVectors(vector1, vector2);

    const uv = new Vector2();

    const v1 = new Vertex(
      this.triangle.a.x,
      this.triangle.a.y,
      this.triangle.a.z,
      normal,
      uv
    );
    const v2 = new Vertex(
      this.triangle.b.x,
      this.triangle.b.y,
      this.triangle.b.z,
      normal,
      uv
    );
    const v3 = new Vertex(
      this.triangle.c.x,
      this.triangle.c.y,
      this.triangle.c.z,
      normal,
      uv
    );

    polygons.push(Polygon.Make([v1, v2, v3]));
  }

  public collectCsgPolygons(polygons: CsgPolygon[]): void {
    const vector1 = new Vector3().subVectors(this.triangle.b, this.triangle.a);
    const vector2 = new Vector3().subVectors(this.triangle.c, this.triangle.a);
    const normal = new Vector3().crossVectors(vector1, vector2);

    const v1 = new CsgVertex(
      new Vector(this.triangle.a.x, this.triangle.a.y, this.triangle.a.z),
      new Vector(normal.x, normal.y, normal.z)
    );
    const v2 = new CsgVertex(
      new Vector(this.triangle.b.x, this.triangle.b.y, this.triangle.b.z),
      new Vector(normal.x, normal.y, normal.z)
    );
    const v3 = new CsgVertex(
      new Vector(this.triangle.c.x, this.triangle.c.y, this.triangle.c.z),
      new Vector(normal.x, normal.y, normal.z)
    );

    polygons.push(new CsgPolygon([v1, v2, v3], false));
  }
}
