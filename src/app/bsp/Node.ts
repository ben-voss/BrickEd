import Polygon, { SideClassification } from "./Polygon";

export default class Node {
  private polygons: Polygon[];
  private front?: Node;
  private back?: Node;
  private divider?: Polygon;

  constructor(polygons?: Polygon[]) {
    const front: Polygon[] = [];
    const back: Polygon[] = [];

    this.polygons = [];

    if (!(polygons instanceof Array) || polygons.length === 0) {
      return;
    }

    this.divider = polygons[0].clone();

    const count = polygons.length;
    for (let i = 0; i < count; i++) {
      this.divider.splitPolygon(
        polygons[i],
        this.polygons,
        this.polygons,
        front,
        back
      );
    }

    if (front.length > 0) {
      this.front = new Node(front);
    }

    if (back.length > 0) {
      this.back = new Node(back);
    }
  }

  public isConvex(polygons: Polygon[]): boolean {
    for (let i = 0; i < polygons.length; i++) {
      for (let j = 0; j < polygons.length; j++) {
        if (
          i !== j &&
          polygons[i].classifySide(polygons[j]) !== SideClassification.Back
        ) {
          return false;
        }
      }
    }

    return true;
  }

  public build(polygons: Polygon[]): void {
    const front: Polygon[] = [];
    const back: Polygon[] = [];

    if (!this.divider) {
      this.divider = polygons[0].clone();
    }

    const polygon_count = polygons.length;
    for (let i = 0; i < polygon_count; i++) {
      this.divider.splitPolygon(
        polygons[i],
        this.polygons,
        this.polygons,
        front,
        back
      );
    }

    if (front.length > 0) {
      if (!this.front) {
        this.front = new Node();
      }

      this.front.build(front);
    }

    if (back.length > 0) {
      if (!this.back) {
        this.back = new Node();
      }

      this.back.build(back);
    }
  }

  public allPolygons(): Polygon[] {
    let polygons = this.polygons.slice();
    if (this.front) {
      polygons = polygons.concat(this.front.allPolygons());
    }

    if (this.back) {
      polygons = polygons.concat(this.back.allPolygons());
    }

    return polygons;
  }

  public clone(): Node {
    const node = new Node();

    node.divider = this.divider && this.divider.clone();
    node.polygons = this.polygons.map((x) => x.clone());
    node.front = this.front && this.front.clone();
    node.back = this.back && this.back.clone();

    return node;
  }

  public invert(): Node {
    const count = this.polygons.length;
    for (let i = 0; i < count; i++) {
      this.polygons[i].flip();
    }

    if (this.divider) {
      this.divider.flip();
    }

    if (this.front) {
      this.front.invert();
    }

    if (this.back) {
      this.back.invert();
    }

    const temp = this.front;
    this.front = this.back;
    this.back = temp;

    return this;
  }

  public clipPolygons(polygons: Polygon[]): Polygon[] {
    if (!this.divider) {
      return polygons.slice();
    }

    let front: Polygon[] = [];
    let back: Polygon[] = [];

    const count = polygons.length;
    for (let i = 0; i < count; i++) {
      this.divider.splitPolygon(polygons[i], front, back, front, back);
    }

    if (this.front) {
      front = this.front.clipPolygons(front);
    }

    if (this.back) {
      back = this.back.clipPolygons(back);
    }

    return front.concat(back);
  }

  public clipTo(node: Node): void {
    this.polygons = node.clipPolygons(this.polygons);

    if (this.front) {
      this.front.clipTo(node);
    }

    if (this.back) {
      this.back.clipTo(node);
    }
  }
}
