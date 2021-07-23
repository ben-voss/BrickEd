import Polygon from "./Polygon";
import Vector from "./Vector";

export default class Plane {
  public normal: Vector;
  private w: number;

  static EPSILON = 0; //1e-5;

  constructor(normal: Vector, w: number) {
    this.normal = normal;
    this.w = w;
  }

  public static fromPoints(a: Vector, b: Vector, c: Vector): Plane {
    const n = b.minus(a).cross(c.minus(a)).unit();
    return new Plane(n, n.dot(a));
  }

  public clone(): Plane {
    return new Plane(this.normal.clone(), this.w);
  }

  public flip(): void {
    this.normal = this.normal.negated();
    this.w = -this.w;
  }

  // Split `polygon` by this plane if needed, then put the polygon or polygon
  // fragments in the appropriate lists. Coplanar polygons go into either
  // `coplanarFront` or `coplanarBack` depending on their orientation with
  // respect to this plane. Polygons in front or in back of this plane go into
  // either `front` or `back`.
  public splitPolygon(
    polygon: Polygon,
    coplanarFront: Polygon[],
    coplanarBack: Polygon[],
    front: Polygon[],
    back: Polygon[]
  ): void {
    const COPLANAR = 0;
    const FRONT = 1;
    const BACK = 2;
    const SPANNING = 3;

    // Classify each point as well as the entire polygon into one of the above
    // four classes.
    let polygonType = 0;
    const types: number[] = [];
    for (let i = 0; i < polygon.vertices.length; i++) {
      const t = this.normal.dot(polygon.vertices[i].pos) - this.w;
      const type =
        t < -Plane.EPSILON ? BACK : t > Plane.EPSILON ? FRONT : COPLANAR;
      polygonType |= type;
      types.push(type);
    }

    // Put the polygon in the correct list, splitting it when necessary.
    switch (polygonType) {
      case COPLANAR: {
        (this.normal.dot(polygon.plane.normal) > 0
          ? coplanarFront
          : coplanarBack
        ).push(polygon);
        break;
      }

      case FRONT: {
        front.push(polygon);
        break;
      }

      case BACK: {
        back.push(polygon);
        break;
      }

      case SPANNING: {
        const f = [];
        const b = [];

        for (let i = 0; i < polygon.vertices.length; i++) {
          const j = (i + 1) % polygon.vertices.length;
          const ti = types[i];
          const tj = types[j];
          const vi = polygon.vertices[i];
          const vj = polygon.vertices[j];

          if (ti != BACK) {
            f.push(vi);
          }

          if (ti != FRONT) {
            b.push(ti != BACK ? vi.clone() : vi);
          }

          if ((ti | tj) == SPANNING) {
            const t =
              (this.w - this.normal.dot(vi.pos)) /
              this.normal.dot(vj.pos.minus(vi.pos));
            const v = vi.interpolate(vj, t);
            f.push(v);
            b.push(v.clone());
          }
        }

        if (f.length >= 3) {
          front.push(new Polygon(f, polygon.shared));
        }

        if (b.length >= 3) {
          back.push(new Polygon(b, polygon.shared));
        }

        break;
      }
    }
  }
}
