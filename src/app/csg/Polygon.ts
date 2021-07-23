import Plane from "./Plane";
import Vertex from "./Vertex";

export default class Polygon {
  public plane: Plane;
  public shared: boolean;
  public vertices: Vertex[];

  constructor(vertices: Vertex[], shared: boolean) {
    this.vertices = vertices;
    this.shared = shared;
    this.plane = Plane.fromPoints(
      vertices[0].pos,
      vertices[1].pos,
      vertices[2].pos
    );
  }

  public clone(): Polygon {
    const vertices = this.vertices.map((v) => v.clone());
    return new Polygon(vertices, this.shared);
  }

  public flip(): void {
    this.vertices.reverse().map((v) => v.flip());
    this.plane.flip();
  }
}
