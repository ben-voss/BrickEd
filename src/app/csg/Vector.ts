export default class Vector {
  public x: number;
  public y: number;
  public z: number;

  constructor(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  public clone(): Vector {
    return new Vector(this.x, this.y, this.z);
  }

  public negated(): Vector {
    return new Vector(-this.x, -this.y, -this.z);
  }

  public plus(a: Vector): Vector {
    return new Vector(this.x + a.x, this.y + a.y, this.z + a.z);
  }

  public minus(a: Vector): Vector {
    return new Vector(this.x - a.x, this.y - a.y, this.z - a.z);
  }

  public times(a: number): Vector {
    return new Vector(this.x * a, this.y * a, this.z * a);
  }

  public dividedBy(a: number): Vector {
    return new Vector(this.x / a, this.y / a, this.z / a);
  }

  public dot(a: Vector): number {
    return this.x * a.x + this.y * a.y + this.z * a.z;
  }

  public lerp(a: Vector, t: number): Vector {
    return this.plus(a.minus(this).times(t));
  }

  public length(): number {
    return Math.sqrt(this.dot(this));
  }

  public unit(): Vector {
    return this.dividedBy(this.length());
  }

  public abs(): Vector {
    return new Vector(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z));
  }

  public cross(a: Vector): Vector {
    return new Vector(
      this.y * a.z - this.z * a.y,
      this.z * a.x - this.x * a.z,
      this.x * a.y - this.y * a.x
    );
  }

  public equals(a: Vector): boolean {
    const eps = 0.00001;
    return (
      Math.abs(a.x - this.x) < eps &&
      Math.abs(a.y - this.y) < eps &&
      Math.abs(a.z - this.z) < eps
    );
  }
}
