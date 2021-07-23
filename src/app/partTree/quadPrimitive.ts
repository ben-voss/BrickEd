import { Triangle, Vector2, Vector3 } from "three";
import Polygon from "../bsp/Polygon";
import Vertex from "../bsp/Vertex";
import LdrColor from "../files/LdrColor";
import QuadCommand from "../files/QuadCommand";
import Primitive from "./primitive";
import CsgPolygon from "../csg/Polygon";
import Vector from "../csg/Vector";
import CsgVertex from "../csg/Vertex";

export default class QuadPrimitive implements Primitive {
  private command: QuadCommand;
  private color: LdrColor;
  private t1: Triangle;
  private t2: Triangle;

  constructor(
    command: QuadCommand,
    color: LdrColor,
    t1: Triangle,
    t2: Triangle
  ) {
    this.command = command;
    this.color = color;
    this.t1 = t1;
    this.t2 = t2;
  }

  public collectPolygons(polygons: Polygon[]): void {
    const vector1 = new Vector3().subVectors(this.t1.b, this.t1.a);
    const vector2 = new Vector3().subVectors(this.t1.c, this.t1.a);
    const normal = new Vector3().crossVectors(vector1, vector2);

    const uv = new Vector2();

    const t1v1 = new Vertex(this.t1.a.x, this.t1.a.y, this.t1.a.z, normal, uv);
    const t1v2 = new Vertex(this.t1.b.x, this.t1.b.y, this.t1.b.z, normal, uv);
    const t1v3 = new Vertex(this.t1.c.x, this.t1.c.y, this.t1.c.z, normal, uv);

    polygons.push(Polygon.Make([t1v1, t1v2, t1v3]));

    const t2v1 = new Vertex(this.t2.a.x, this.t2.a.y, this.t2.a.z, normal, uv);
    const t2v2 = new Vertex(this.t2.b.x, this.t2.b.y, this.t2.b.z, normal, uv);
    const t2v3 = new Vertex(this.t2.c.x, this.t2.c.y, this.t2.c.z, normal, uv);

    polygons.push(Polygon.Make([t2v1, t2v2, t2v3]));
  }

  public collectCsgPolygons(polygons: CsgPolygon[]): void {
    const vector1 = new Vector3().subVectors(this.t1.b, this.t1.a);
    const vector2 = new Vector3().subVectors(this.t1.c, this.t1.a);
    const normal = new Vector3().crossVectors(vector1, vector2);

    const t1v1 = new CsgVertex(
      new Vector(this.t1.a.x, this.t1.a.y, this.t1.a.z),
      new Vector(normal.x, normal.y, normal.z)
    );
    const t1v2 = new CsgVertex(
      new Vector(this.t1.b.x, this.t1.b.y, this.t1.b.z),
      new Vector(normal.x, normal.y, normal.z)
    );
    const t1v3 = new CsgVertex(
      new Vector(this.t1.c.x, this.t1.c.y, this.t1.c.z),
      new Vector(normal.x, normal.y, normal.z)
    );

    polygons.push(new CsgPolygon([t1v1, t1v2, t1v3], false));

    const t2v1 = new CsgVertex(
      new Vector(this.t2.a.x, this.t2.a.y, this.t2.a.z),
      new Vector(normal.x, normal.y, normal.z)
    );
    const t2v2 = new CsgVertex(
      new Vector(this.t2.b.x, this.t2.b.y, this.t2.b.z),
      new Vector(normal.x, normal.y, normal.z)
    );
    const t2v3 = new CsgVertex(
      new Vector(this.t2.c.x, this.t2.c.y, this.t2.c.z),
      new Vector(normal.x, normal.y, normal.z)
    );

    polygons.push(new CsgPolygon([t2v1, t2v2, t2v3], false));
  }
}
