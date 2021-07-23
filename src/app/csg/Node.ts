// https://github.com/jscad/OpenJSCAD.org/blob/b0fd63e3501fc0f633e0c72b82199c1680738918/packages/modeling/src/operations/booleans/trees/Node.js#L36

import Plane from "./Plane";
import Polygon from "./Polygon";

export default class Node {
  private plane: Plane | undefined;
  private front: Node | undefined;
  private back: Node | undefined;
  private polygons: Polygon[] = [];

  constructor(polygons?: Polygon[]) {
    if (polygons) {
      this.build(polygons);
    }
  }

  public clone(): Node {
    const node = new Node();
    node.plane = this.plane && this.plane.clone();
    node.front = this.front && this.front.clone();
    node.back = this.back && this.back.clone();
    node.polygons = this.polygons.map((p) => p.clone());
    return node;
  }

  // Convert solid space to empty space and empty space to solid space.
  public invert(): void {
    for (let i = 0; i < this.polygons.length; i++) {
      this.polygons[i].flip();
    }

    if (this.plane) {
      this.plane.flip();
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
  }

  // Recursively remove all polygons in `polygons` that are inside this BSP
  // tree.
  public clipPolygons(polygons: Polygon[]): Polygon[] {
    if (!this.plane) {
      return polygons.slice();
    }

    let front: Polygon[] = [];
    let back: Polygon[] = [];

    for (let i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(polygons[i], front, back, front, back);
    }

    if (this.front) {
      front = this.front.clipPolygons(front);
    }

    if (this.back) {
      back = this.back.clipPolygons(back);
    } else {
      back = [];
    }

    return front.concat(back);
  }

  // Remove all polygons in this BSP tree that are inside the other BSP tree
  // `bsp`.
  public clipTo(bsp: Node): void {
    this.polygons = bsp.clipPolygons(this.polygons);
    if (this.front) {
      this.front.clipTo(bsp);
    }

    if (this.back) {
      this.back.clipTo(bsp);
    }
  }

  // Return a list of all polygons in this BSP tree.
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

  // Build a BSP tree out of `polygons`. When called on an existing tree, the
  // new polygons are filtered down to the bottom of the tree and become new
  // nodes there. Each set of polygons is partitioned using the first polygon
  // (no heuristic is used to pick a good split).
  public build(polygons: Polygon[]): void {
    if (!polygons.length) {
      return;
    }

    if (!this.plane) {
      this.plane = polygons[0].plane.clone();
    }

    const front: Polygon[] = [];
    const back: Polygon[] = [];

    for (let i = 0; i < polygons.length; i++) {
      this.plane.splitPolygon(
        polygons[i],
        this.polygons,
        this.polygons,
        front,
        back
      );
    }

    if (front.length) {
      if (!this.front) {
        this.front = new Node();
      }

      this.front.build(front);
    }

    if (back.length) {
      if (!this.back) {
        this.back = new Node();
      }

      this.back.build(back);
    }
  }
}
