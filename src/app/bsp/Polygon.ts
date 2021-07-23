import { Vector2, Vector3 } from "three";
import Vertex from "./Vertex";

export enum VertexClassification {
  Coplanar = 0,
  Front = 1,
  Back = 2,
  Spanning = 3
}

export enum SideClassification {
  Coplanar = 0,
  Front = 1,
  Back = 2,
  Spanning = 3
}

const EPSILON = 1e-5;

export default class Polygon {
  public vertices: Vertex[];
  public normal: Vertex;
  public w: number;

  constructor(vertices: Vertex[], normal: Vertex, w: number) {
    this.vertices = vertices;
    this.normal = normal;
    this.w = w;
  }

  public static Make(vertices: Vertex[]): Polygon {
    if (vertices.length > 0) {
      const a = vertices[0];
      const b = vertices[1];
      const c = vertices[2];

      const normal = b
        .clone()
        .subtract(a)
        .cross(c.clone().subtract(a))
        .normalize();

      const w = normal.clone().dot(a);

      return new Polygon(vertices, normal, w);
    } else {
      return new Polygon(
        [],
        new Vertex(0, 0, 0, new Vector3(), new Vector2()),
        0
      );
    }
  }

  public clone(): Polygon {
    const vertices = [];

    const count = this.vertices.length;
    for (let i = 0; i < count; i++) {
      vertices.push(this.vertices[i].clone());
    }

    return new Polygon(vertices, this.normal, this.w);
  }

  public flip(): Polygon {
    const vertices = [];

    this.normal.multiplyScalar(-1);
    this.w *= -1;

    for (let i = this.vertices.length - 1; i >= 0; i--) {
      vertices.push(this.vertices[i]);
    }
    this.vertices = vertices;

    return this;
  }

  public classifyVertex(vertex: Vertex): VertexClassification {
    const side = this.normal.dot(vertex) - this.w;

    if (side < -EPSILON) {
      return VertexClassification.Back;
    } else if (side > EPSILON) {
      return VertexClassification.Front;
    } else {
      return VertexClassification.Coplanar;
    }
  }

  public classifySide(polygon: Polygon): SideClassification {
    let positiveCount = 0;
    let negativeCount = 0;

    const count = polygon.vertices.length;
    for (let i = 0; i < count; i++) {
      const vertex = polygon.vertices[i];
      const classification = this.classifyVertex(vertex);
      if (classification === VertexClassification.Front) {
        positiveCount++;
      } else if (classification === VertexClassification.Back) {
        negativeCount++;
      }
    }

    if (positiveCount === count && negativeCount === 0) {
      return SideClassification.Front;
    } else if (positiveCount === 0 && negativeCount === count) {
      return SideClassification.Back;
    } else if (positiveCount > 0 && negativeCount > 0) {
      return SideClassification.Spanning;
    } else {
      return SideClassification.Coplanar;
    }
  }

  public splitPolygon(
    polygon: Polygon,
    coplanar_front: Polygon[],
    coplanar_back: Polygon[],
    front: Polygon[],
    back: Polygon[]
  ): void {
    const classification = this.classifySide(polygon);

    if (classification === SideClassification.Coplanar) {
      (this.normal.dot(polygon.normal) > 0
        ? coplanar_front
        : coplanar_back
      ).push(polygon);
    } else if (classification === SideClassification.Front) {
      front.push(polygon);
    } else if (classification === SideClassification.Back) {
      back.push(polygon);
    } else {
      const fronts: Vertex[] = [];
      const backs: Vertex[] = [];

      const length = polygon.vertices.length;
      for (let i = 0; i < length; i++) {
        const j = (i + 1) % length;
        const vi = polygon.vertices[i];
        const vj = polygon.vertices[j];
        const ti = this.classifyVertex(vi);
        const tj = this.classifyVertex(vj);

        if (ti != VertexClassification.Back) {
          fronts.push(vi);
        }

        if (ti != VertexClassification.Front) {
          backs.push(ti != VertexClassification.Back ? vi.clone() : vi);
        }

        if ((ti | tj) === VertexClassification.Spanning) {
          const t =
            (this.w - this.normal.dot(vi)) /
            this.normal.dot(vj.clone().subtract(vi));
          const v = vi.interpolate(vj, t);
          fronts.push(v);
          backs.push(v.clone());
        }
      }

      if (fronts.length >= 3) {
        front.push(Polygon.Make(fronts));
      }

      if (backs.length >= 3) {
        back.push(Polygon.Make(backs));
      }
    }
  }
}
