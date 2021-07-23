import {
  Box3,
  Box3Helper,
  BufferAttribute,
  Color,
  Frustum,
  Group,
  Line3,
  PlaneHelper,
  Ray,
  Triangle,
  Vector3
} from "three";
import LdrColor from "./files/LdrColor";
import PartDrawList from "./PartDrawList";

interface HitTest {
  parts: PartDrawList[];
  distanceSq: number;
}

class Node {
  private readonly tempVector = new Vector3();

  public readonly nodes: (Node | null)[] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ];
  public readonly box: Box3;
  public readonly parts: PartDrawList[] | null;

  constructor(box: Box3, parts: PartDrawList[]) {
    this.box = box;

    // Stop recursion when there is only one node in the tree
    if (parts.length == 1) {
      this.parts = parts;
      return;
    }

    // Make a box that is half the size in all dimensions
    // Stop if any of the sizes are too small.  The threshold is based
    // on the thickness of a plate piece.
    const sizeX = (box.max.x - box.min.x) * 0.5;
    if (sizeX < 8) {
      this.parts = parts;
      return;
    }

    const sizeY = (box.max.y - box.min.y) * 0.5;
    if (sizeY < 8) {
      this.parts = parts;
      return;
    }

    const sizeZ = (box.max.z - box.min.z) * 0.5;
    if (sizeZ < 8) {
      this.parts = parts;
      return;
    }

    this.parts = null;

    for (let x = 0; x < 2; x++) {
      for (let y = 0; y < 2; y++) {
        for (let z = 0; z < 2; z++) {
          // Construct a child box in each quadrant and then
          // select the parts that intersect the box.  If there
          // are any parts then create a child node.
          const childBox = new Box3();
          childBox.min.x = this.box.min.x + x * sizeX;
          childBox.min.y = this.box.min.y + y * sizeY;
          childBox.min.z = this.box.min.z + z * sizeZ;
          childBox.max.x = childBox.min.x + sizeX;
          childBox.max.y = childBox.min.y + sizeY;
          childBox.max.z = childBox.min.z + sizeZ;

          const filteredParts = parts.filter((p) =>
            p.transformedBoundingBox.intersectsBox(childBox)
          );

          if (filteredParts.length > 0) {
            this.nodes[x * 4 + y * 2 + z] = new Node(childBox, filteredParts);
          }
        }
      }
    }
  }

  // Determine the intersection of the parts with the specified vector.
  // Each list of parts is added to the list of results along with the
  // distance of the centre of the box to the ray origin so that the
  // hit test can be sorted into distance order.
  public rayIntersect(ray: Ray, result: HitTest[]): void {
    const distanceVector = ray.intersectBox(this.box, this.tempVector);

    if (distanceVector !== null) {
      if (this.parts !== null) {
        result.push({
          parts: this.parts,
          distanceSq: distanceVector.distanceToSquared(ray.origin)
        });
      } else {
        for (let i = 0; i < this.nodes.length; i++) {
          const node = this.nodes[i];
          if (node !== null) {
            node.rayIntersect(ray, result);
          }
        }
      }
    }
  }

  public frustumIntersect(frustum: Frustum, result: PartDrawList[]): void {
    if (frustum.intersectsBox(this.box)) {
      this.selected = true;

      if (this.parts !== null) {
        // Add the parts avoiding duplicates that would occur because parts are contained
        // in more than one octree node
        for (let i = 0; i < this.parts.length; i++) {
          const part = this.parts[i];
          if (result.indexOf(part) === -1) {
            result.push(part);
          }
        }
      } else {
        for (let i = 0; i < this.nodes.length; i++) {
          const node = this.nodes[i];
          if (node !== null) {
            node.frustumIntersect(frustum, result);
          }
        }
      }
    }
  }

  private selected = false;

  public resetSelection(): void {
    if (!this.selected) {
      return;
    }

    this.selected = false;
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      if (node !== null) {
        node.resetSelection();
      }
    }
  }

  public makeMesh(): Group {
    const group = new Group();

    if (this.selected) {
      group.add(new Box3Helper(this.box, new Color(1, 0, 0)));
    } else {
      group.add(new Box3Helper(this.box, new Color(0, 1, 0)));
    }

    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      if (node != null) {
        group.add(node.makeMesh());
      }
    }

    return group;
  }
}

// https://en.wikipedia.org/wiki/Octree#:~:text=An%20octree%20is%20a%20tree,three%2Ddimensional%20analog%20of%20quadtrees.
export default class Octree {
  private readonly v1 = new Vector3();
  private readonly v2 = new Vector3();
  private readonly v3 = new Vector3();
  private readonly v4 = new Vector3();
  private readonly target = new Vector3();
  private readonly tempLine = new Line3();

  private root!: Node;

  private frustum: Frustum | null = null;

  private ceilPow2(x: number): number {
    if (x <= 1) {
      return 1;
    }

    let power = 2;
    x--;
    while ((x >>= 1) != 0) {
      power <<= 1;
    }

    return power;
  }

  public generate(parts: PartDrawList[]): void {
    // Determine the bounding box that covers all the parts
    const box = new Box3();
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      box.union(part.transformedBoundingBox);
    }

    // Round the box size and position so it aligns on integer
    // coordinates and so that the size is a power of two
    // this ensures that we can divide the boxes in half evenly
    box.min.x = Math.floor(box.min.x);
    box.min.y = Math.floor(box.min.y);
    box.min.z = Math.floor(box.min.z);

    box.max.x = this.ceilPow2(box.max.x - box.min.x) + box.min.x;
    box.max.y = this.ceilPow2(box.max.y - box.min.y) + box.min.y;
    box.max.z = this.ceilPow2(box.max.z - box.min.z) + box.min.z;

    this.root = new Node(box, parts);
  }

  // Determine the intersection of the parts with the specified vectors
  // returns the part that is closest to the ray origin
  public rayIntersect(
    ray: Ray,
    vertexBuffersByColor: Map<LdrColor, BufferAttribute>
  ): PartDrawList | null {
    let result: PartDrawList | null = null;
    let bestDistanceSq = Infinity;

    // Gather all the intersections
    const hitTests: HitTest[] = [];
    this.root.rayIntersect(ray, hitTests);

    // Sort them by distance from the ray origin
    hitTests.sort((a, b) => {
      return a.distanceSq - b.distanceSq;
    });

    // Iterate the hit tests from the closest box to the furthest and test all
    // the parts in the box.  Keep track of the part that has a hit closest
    // to the ray origin and return it.
    for (let i = 0; i < hitTests.length; i++) {
      const hitTest = hitTests[i];

      for (let j = hitTest.parts.length - 1; j >= 0; j--) {
        const part = hitTest.parts[j];

        for (const [c, is] of part.triangleIndexesByColor) {
          const vertexBuffer = vertexBuffersByColor.get(c);
          if (vertexBuffer) {
            const vb = vertexBuffer.array;

            for (let idx = 0; idx < is.length; idx += 3) {
              const is1 = is[idx] * 3;
              const is2 = is[idx + 1] * 3;
              const is3 = is[idx + 2] * 3;

              this.v1.x = vb[is1];
              this.v1.y = vb[is1 + 1];
              this.v1.z = vb[is1 + 2];

              this.v2.x = vb[is2];
              this.v2.y = vb[is2 + 1];
              this.v2.z = vb[is2 + 2];

              this.v3.x = vb[is3];
              this.v3.y = vb[is3 + 1];
              this.v3.z = vb[is3 + 2];

              if (
                ray.intersectTriangle(
                  this.v1,
                  this.v2,
                  this.v3,
                  false,
                  this.target
                ) !== null
              ) {
                const distanceSq = this.target.distanceToSquared(ray.origin);

                if (distanceSq < bestDistanceSq) {
                  bestDistanceSq = distanceSq;
                  result = part;
                }
              }
            }
          }
        }
      }

      if (result !== null) {
        return result;
      }
    }

    return result;
  }

  public frustumIntersect(
    frustum: Frustum,
    vertexBuffersByColor: Map<LdrColor, BufferAttribute>
  ): PartDrawList[] {
    const parts: PartDrawList[] = [];
    const result: PartDrawList[] = [];

    this.root.frustumIntersect(frustum, parts);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Discard any parts that are entirely outside the frustum
      if (!frustum.intersectsBox(part.transformedBoundingBox)) {
        continue;
      }

      // Since the bounding box is in the frustum we need to check the geometry in detail
      // to ensure that at least one part of it is in the frustum.
      if (this.partIntersectsFrustum(frustum, part, vertexBuffersByColor)) {
        result.push(part);
      }
    }

    return result;
  }

  private partIntersectsFrustum(
    frustum: Frustum,
    part: PartDrawList,
    vertexBuffersByColor: Map<LdrColor, BufferAttribute>
  ): boolean {
    this.frustum = frustum;

    for (const [c, is] of part.triangleIndexesByColor) {
      const vertexBuffer = vertexBuffersByColor.get(c);
      if (!vertexBuffer) {
        continue;
      }

      const vb = vertexBuffer.array;

      for (let idx = 0; idx < is.length; idx += 3) {
        // If any of the points are inside the frustum then the
        // part must be in the frustum
        const is1 = is[idx] * 3;
        this.v1.x = vb[is1];
        this.v1.y = vb[is1 + 1];
        this.v1.z = vb[is1 + 2];

        if (frustum.containsPoint(this.v1)) {
          return true;
        }

        const is2 = is[idx + 1] * 3;
        this.v2.x = vb[is2];
        this.v2.y = vb[is2 + 1];
        this.v2.z = vb[is2 + 2];

        if (frustum.containsPoint(this.v2)) {
          return true;
        }

        const is3 = is[idx + 2] * 3;
        this.v3.x = vb[is3];
        this.v3.y = vb[is3 + 1];
        this.v3.z = vb[is3 + 2];

        if (frustum.containsPoint(this.v3)) {
          return true;
        }

        if (this.isSegmentInside(this.v1, this.v2, frustum)) {
          return true;
        }

        if (this.isSegmentInside(this.v2, this.v3, frustum)) {
          return true;
        }

        if (this.isSegmentInside(this.v3, this.v1, frustum)) {
          return true;
        }
      }
    }

    return false;
  }

  // https://community.khronos.org/t/intersecting-a-3d-segment-with-perspective-frustum/59537
  private isSegmentInside(a: Vector3, b: Vector3, frustum: Frustum): boolean {
    this.tempLine.set(a, b);

    const planes = frustum.planes;
    for (let i = 0; i < planes.length; i++) {
      const plane = planes[i];

      const distA = plane.distanceToPoint(a); // signed. Negative value means outside
      const distB = plane.distanceToPoint(b);

      if (distA < 0 && distB < 0) {
        return false; // completely outside
      }

      if (distA * distB > 0) {
        continue; // both points are inside, no clip
      }

      // now, clipping
      const pointC = plane.intersectLine(this.tempLine, this.v4);
      if (pointC !== null) {
        if (distA < 0) {
          a = pointC;
        } else {
          b = pointC;
        }
      }
    }

    return true;
  }

  public makeMesh(): Group {
    const group = this.root.makeMesh();

    if (this.frustum !== null) {
      for (let i = 0; i < this.frustum.planes.length; i++) {
        const plane = this.frustum.planes[i];

        group.add(new PlaneHelper(plane, 1, 0));
      }
    }

    return group;
  }

  public resetSelection(): void {
    this.root.resetSelection();
  }

  private areProjectionsSeparated(
    p0: number,
    p1: number,
    p2: number,
    q0: number,
    q1: number,
    q2: number
  ): boolean {
    const min_p = Math.min(p0, p1, p2),
      max_p = Math.max(p0, p1, p2),
      min_q = Math.min(q0, q1, q2),
      max_q = Math.max(q0, q1, q2);

    return min_p > max_q || max_p < min_q;
  }

  //https://forum.babylonjs.com/t/precise-mesh-intersection-detection/8444/4
  //https://www.babylonjs-playground.com/#4TXNWN#7

  // https://github.com/kenny-evitt/three-js-triangle-triangle-collision-detection/blob/master/collision-tests.js
  private trianglesIntersect(t1: Triangle, t2: Triangle): boolean {
    // Triangle 1:
    const A0 = t1.a;
    const A1 = t1.b;
    const A2 = t1.c;

    const E0 = A1.clone().sub(A0);
    const E1 = A2.clone().sub(A0);

    const E2 = E1.clone().sub(E0);

    const N = E0.clone().cross(E1);

    // Triangle 2:
    const B0 = t2.a;
    const B1 = t2.b;
    const B2 = t2.c;

    const F0 = B1.clone().sub(B0);
    const F1 = B2.clone().sub(B0);

    const F2 = F1.clone().sub(F0);

    const M = F0.clone().cross(F1);

    const D = B0.clone().sub(A0);

    // Only potential separating axes for non-parallel and non-coplanar triangles are tested.

    // Seperating axis: N
    {
      const p0 = 0,
        p1 = 0,
        p2 = 0,
        q0 = N.dot(D),
        q1 = q0 + N.dot(F0),
        q2 = q0 + N.dot(F1);

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Separating axis: M
    {
      const p0 = 0,
        p1 = M.dot(E0),
        p2 = M.dot(E1),
        q0 = M.dot(D),
        q1 = q0,
        q2 = q0;

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E0 × F0
    {
      const p0 = 0,
        p1 = 0,
        p2 = -N.dot(F0),
        q0 = E0.clone().cross(F0).dot(D),
        q1 = q0,
        q2 = q0 + M.dot(E0);

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E0 × F1
    {
      const p0 = 0,
        p1 = 0,
        p2 = -N.dot(F1),
        q0 = E0.clone().cross(F1).dot(D),
        q1 = q0 - M.dot(E0),
        q2 = q0;

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E0 × F2
    {
      const p0 = 0,
        p1 = 0,
        p2 = -N.dot(F2),
        q0 = E0.clone().cross(F2).dot(D),
        q1 = q0 - M.dot(E0),
        q2 = q1;

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E1 × F0
    {
      const p0 = 0,
        p1 = N.dot(F0),
        p2 = 0,
        q0 = E1.clone().cross(F0).dot(D),
        q1 = q0,
        q2 = q0 + M.dot(E1);

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E1 × F1
    {
      const p0 = 0,
        p1 = N.dot(F1),
        p2 = 0,
        q0 = E1.clone().cross(F1).dot(D),
        q1 = q0 - M.dot(E1),
        q2 = q0;

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E1 × F2
    {
      const p0 = 0,
        p1 = N.dot(F2),
        p2 = 0,
        q0 = E1.clone().cross(F2).dot(D),
        q1 = q0 - M.dot(E1),
        q2 = q1;

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E2 × F0
    {
      const p0 = 0,
        p1 = N.dot(F0),
        p2 = p1,
        q0 = E2.clone().cross(F0).dot(D),
        q1 = q0,
        q2 = q0 + M.dot(E2);

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E2 × F1
    {
      const p0 = 0,
        p1 = N.dot(F1),
        p2 = p1,
        q0 = E2.clone().cross(F1).dot(D),
        q1 = q0 - M.dot(E2),
        q2 = q0;

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    // Seperating axis: E2 × F2
    {
      const p0 = 0,
        p1 = N.dot(F2),
        p2 = p1,
        q0 = E2.clone().cross(F2).dot(D),
        q1 = q0 - M.dot(E2),
        q2 = q1;

      if (this.areProjectionsSeparated(p0, p1, p2, q0, q1, q2)) {
        return false;
      }
    }

    return true;
  }

  private rayTriangleIntersect(
    ray: Ray,
    vertexBuffersByColor: Map<LdrColor, BufferAttribute>
  ): Triangle | null {
    let result: Triangle | null = null;
    let bestDistanceSq = Infinity;

    // Gather all the intersections
    const hitTests: HitTest[] = [];
    this.root.rayIntersect(ray, hitTests);

    // Sort them by distance from the ray origin
    hitTests.sort((a, b) => {
      return a.distanceSq - b.distanceSq;
    });

    // Iterate the hit tests from the closest box to the furthest and test all
    // the parts in the box.  Keep track of the part that has a hit closest
    // to the ray origin and return it.
    for (let i = 0; i < hitTests.length; i++) {
      const hitTest = hitTests[i];

      for (let j = hitTest.parts.length - 1; j >= 0; j--) {
        const part = hitTest.parts[j];

        for (const [c, is] of part.triangleIndexesByColor) {
          const vertexBuffer = vertexBuffersByColor.get(c);
          if (vertexBuffer) {
            const vb = vertexBuffer.array;

            for (let idx = 0; idx < is.length; idx += 3) {
              const is1 = is[idx] * 3;
              const is2 = is[idx + 1] * 3;
              const is3 = is[idx + 2] * 3;

              this.v1.x = vb[is1];
              this.v1.y = vb[is1 + 1];
              this.v1.z = vb[is1 + 2];

              this.v2.x = vb[is2];
              this.v2.y = vb[is2 + 1];
              this.v2.z = vb[is2 + 2];

              this.v3.x = vb[is3];
              this.v3.y = vb[is3 + 1];
              this.v3.z = vb[is3 + 2];

              if (
                ray.intersectTriangle(
                  this.v1,
                  this.v2,
                  this.v3,
                  false,
                  this.target
                ) !== null
              ) {
                const distanceSq = this.target.distanceToSquared(ray.origin);

                if (distanceSq < bestDistanceSq) {
                  bestDistanceSq = distanceSq;
                  result = new Triangle(this.v1, this.v2, this.v3);
                }
              }
            }
          }
        }
      }

      if (result !== null) {
        return result;
      }
    }

    return result;
  }
}
