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

  private readonly nodes: (Node | null)[] = [
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null
  ];
  private readonly box: Box3;
  private readonly parts: PartDrawList[] | null;

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
          const vb = vertexBuffer!.array;

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
      const vb = vertexBuffer!.array;

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
}
