import { Matrix4, Vector2, Vector3 } from "three";

export default class Vertex {
  public x: number;
  public y: number;
  public z: number;
  public normal: Vector3;
  public uv: Vector2;

  constructor(x: number, y: number, z: number, normal: Vector3, uv: Vector2) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.normal = normal;
    this.uv = uv;
  }

  public clone(): Vertex {
    return new Vertex(
      this.x,
      this.y,
      this.z,
      this.normal.clone(),
      this.uv.clone()
    );
  }

  public add(vertex: Vertex): Vertex {
    this.x += vertex.x;
    this.y += vertex.y;
    this.z += vertex.z;
    return this;
  }

  public subtract(vertex: Vertex): Vertex {
    this.x -= vertex.x;
    this.y -= vertex.y;
    this.z -= vertex.z;
    return this;
  }

  public multiplyScalar(scalar: number): Vertex {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  public cross(vertex: Vertex): Vertex {
    const x = this.x;
    const y = this.y;
    const z = this.z;

    this.x = y * vertex.z - z * vertex.y;
    this.y = z * vertex.x - x * vertex.z;
    this.z = x * vertex.y - y * vertex.x;

    return this;
  }

  public normalize(): Vertex {
    const length = Math.sqrt(
      this.x * this.x + this.y * this.y + this.z * this.z
    );

    this.x /= length;
    this.y /= length;
    this.z /= length;

    return this;
  }

  public dot(vertex: Vertex): number {
    return this.x * vertex.x + this.y * vertex.y + this.z * vertex.z;
  }

  public lerp(a: Vertex, t: number): Vertex {
    this.add(a.clone().subtract(this).multiplyScalar(t));
    this.normal.add(a.normal.clone().sub(this.normal).multiplyScalar(t));
    this.uv.add(a.uv.clone().sub(this.uv).multiplyScalar(t));

    return this;
  }

  public interpolate(other: Vertex, t: number): Vertex {
    return this.clone().lerp(other, t);
  }

  public applyMatrix4(m: Matrix4): Vertex {
    const x = this.x;
    const y = this.y;
    const z = this.z;

    const e = m.elements;

    this.x = e[0] * x + e[4] * y + e[8] * z + e[12];
    this.y = e[1] * x + e[5] * y + e[9] * z + e[13];
    this.z = e[2] * x + e[6] * y + e[10] * z + e[14];

    return this;
  }
}
