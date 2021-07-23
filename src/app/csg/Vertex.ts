import Vector from "./Vector";

export default class Vertex {
  public pos: Vector;
  public normal: Vector;

  constructor(pos: Vector, normal: Vector) {
    this.pos = pos;
    this.normal = normal;
  }

  public clone(): Vertex {
    return new Vertex(this.pos.clone(), this.normal.clone());
  }

  // Invert all orientation-specific data (e.g. vertex normal). Called when the
  // orientation of a polygon is flipped.
  public flip(): void {
    this.normal = this.normal.negated();
  }

  // Create a new vertex between this vertex and `other` by linearly
  // interpolating all properties using a parameter of `t`. Subclasses should
  // override this to interpolate additional properties.
  public interpolate(other: Vertex, t: number): Vertex {
    return new Vertex(
      this.pos.lerp(other.pos, t),
      this.normal.lerp(other.normal, t)
    );
  }
}
