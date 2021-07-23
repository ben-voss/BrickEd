import Polygon from "./Polygon";
import Node from "./Node";
import { Box3, BufferAttribute, BufferGeometry, EdgesGeometry, Line, Line3, Plane, Ray, Vector3 } from "three";
import VertexMap from "../VertexMap";
import Vector from "./Vector";

export default class Csg {
  private polygons: Polygon[] = [];

  constructor() {
    //
  }

  public static fromPolygons(polygons: Polygon[]): Csg {
    const csg = new Csg();
    csg.polygons = polygons;
    return csg;
  }

  public clone(): Csg {
    const csg = new Csg();
    csg.polygons = this.polygons.map((p) => p.clone());
    return csg;
  }

  public toPolygons(): Polygon[] {
    return this.polygons;
  }

  // Return a new CSG solid representing space in either this solid or in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  //
  //     A.union(B)
  //
  //     +-------+            +-------+
  //     |       |            |       |
  //     |   A   |            |       |
  //     |    +--+----+   =   |       +----+
  //     +----+--+    |       +----+       |
  //          |   B   |            |       |
  //          |       |            |       |
  //          +-------+            +-------+
  //
  public union(csg: Csg): Csg {
    const a = new Node(this.clone().polygons);
    const b = new Node(csg.clone().polygons);

    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    
    //a.build(b.allPolygons());
    //return Csg.fromPolygons(a.allPolygons());

    const newPoly = a.allPolygons().concat(b.allPolygons());


    return Csg.fromPolygons(newPoly);
  }

  // Return a new CSG solid representing space both this solid and in the
  // solid `csg`. Neither this solid nor the solid `csg` are modified.
  // 
  //     A.intersect(B)
  // 
  //     +-------+
  //     |       |
  //     |   A   |
  //     |    +--+----+   =   +--+
  //     +----+--+    |       +--+
  //          |   B   |
  //          |       |
  //          +-------+
  // 
  public intersect(csg: Csg): Csg {
    const a = new Node(this.clone().polygons);
    const b = new Node(csg.clone().polygons);

    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();

    return Csg.fromPolygons(a.allPolygons());
  }

  // Return a new CSG solid with solid and empty space switched. This solid is
  // not modified.
  public inverse(): Csg {
    const csg = this.clone();
    csg.polygons.map((p) => p.flip());
    return csg;
  }

  // Return a new 3D geometry representing the space in the first geometry but not
  // in the second geometry. None of the given geometries are modified.
  public subtract(csg: Csg): Csg {
    const a = new Node(this.clone().polygons);
    const b = new Node(csg.clone().polygons);

    a.invert();
    a.clipTo(b);
    b.clipTo(a);//, true);
    a.build(b.allPolygons());
    a.invert();

    return Csg.fromPolygons(a.allPolygons());
  }

  public skin(): Csg {
    const polys = this.clone().polygons;

    // Determine a bounding box for the polys so we can cast a ray to its corner
    const box = this.calcBoundingBox(polys);

// Going to need an octree for efficency...


    // Build a list of connected polys.
    const polysGroups: Polygon[][] = [];

    let polysCount = polys.length;
    do {
      const stack: Polygon[] = [];
      const result: Polygon[] = [];

      result.push(polys[0]);
      stack.push(polys[0]);
      polysCount--;
      polys.splice(0, 1);

      do {
        const currentPoly = stack.pop() as Polygon;

        for (let i = 0; i < polysCount; ) {
          const poly = polys[i];
          if (this.isConnectedTo(currentPoly, poly)) {
            result.push(poly);
            polys.splice(i, 1);
            polysCount--;

            stack.push(poly);
          } else {
            i++;
          }
        }
      } while (stack.length > 0);

      polysGroups.push(result);
    } while (polysCount > 0);

    // Test each list of polys to determine if any of them are external.
    // An external poly is one that intersects and even number of polys between one of its vertices
    // and a point on the edge of the bounding box.
    const externalPolys: Polygon[] = [];

    let polysGroupsCount = polysGroups.length;
    for (let i = 0; i < polysGroupsCount; ) {
      const polysGroup = polysGroups[i];

      if (this.isGroupExternal(polysGroup, polys, box.min)) {
        externalPolys.push(...polysGroup);
        i++;
      } else {
        polysGroups.splice(i, 1);
        polysGroupsCount--;
      }
    }

    return Csg.fromPolygons(externalPolys);
  }

  private isGroupExternal(polysGroup: Polygon[], allPolys: Polygon[], externalPoint: Vector3): boolean {
    const polysGroupLength = polysGroup.length;
    for (let j = 0; j < polysGroupLength; j++) {
      if (this.isExternalPoly(polysGroup[j], allPolys, externalPoint)) {
        true;
      }
    }

    return false;
  }

  private isExternalPoly(polygon: Polygon, allPolys: Polygon[], externalPoint: Vector3): boolean {

    // Create a line between the polygon and the externalPoint
    const from = polygon.vertices[0].pos;
    const direction = new Vector3();
    const r = new Ray(externalPoint, direction);
/*
    for (let i = 0; i < allPolys.length; i++) {
      const distance = r.intersectTriangle(a, b, c, false, new Vector3())
      if (distance != null) {
        
      }
    }*/

    return true;
  }

  private calcBoundingBox(polys: Polygon[]): Box3 {
    const box = new Box3();

    const polysLength = polys.length;
    for (let i = 0; i < polysLength; i++) {
      const poly = polys[i];

      const verticesLength = poly.vertices.length;
      for (let j = 0; j < verticesLength; j++) {
        const vertex = poly.vertices[j];

        const v = vertex.pos;

        box.expandByPoint(new Vector3(v.x, v.y, v.z));
      }
    }

    return box;
  }

  private isConnectedTo(polyI: Polygon, polyJ: Polygon): boolean {
    const verticesI = polyI.vertices;
    const vICount = verticesI.length;

    const verticesJ = polyJ.vertices;
    const vJCount = verticesJ.length;

    for (let i = 0; i < vICount; i++) {
      const pI1 = verticesI[i].pos;
      const pI2 = i + 1 === vICount ? verticesI[0].pos : verticesI[i + 1].pos;

      const vI = pI1.clone().minus(pI2);
      const vI1vI2Length = vI.length();

      // Skip points that have a zero length
      if (vI1vI2Length < 0.0001) {
        continue;
      }

      const unitVI = vI.unit().abs();

      for (let j = 0; j < vJCount; j++) {
        const pJ1 = verticesJ[j].pos;
        const pJ2 = j + 1 === vJCount ? verticesJ[0].pos : verticesJ[j + 1].pos;

        const vJ = pJ1.clone().minus(pJ2);
        const vJ1vJ2Length = vJ.length();

        // Skip points that have a zero length
        if (vJ1vJ2Length < 0.0001) {
          continue;
        }

        const unitVJ = vJ.unit().abs();

        // If the two unit vectors i1->i2 and j1->j2 are not the same they must be
        // pointing in different directions so the lines cannot be touching.
        if (!unitVI.equals(unitVJ)) {
          continue;
        }

        // If a unit vector from i1->j1 is not the same as the other two unit vectors
        // then the two lines are parallel but not on the same axis so cannot be touching
        const vI1J1 = pI1.clone().minus(pJ1);
        const unitVVI1J1 = vI1J1.unit().abs();

        if (!unitVI.equals(unitVVI1J1)) {
          continue;
        }

        // Check the distance of both points of one line to the same point on the other and
        // compare to the length of the line to determine if the lines overlap
        const vI1vJ1Length = pJ1.clone().minus(pI1).length();
        const vI1vJ2Length = pJ2.clone().minus(pI1).length();

        if (vI1vJ1Length <= vI1vI2Length && vI1vJ2Length <= vI1vI2Length) {
          return true;
        }

        if (vI1vJ1Length <= vJ1vJ2Length && vI1vJ2Length <= vJ1vJ2Length) {
          return true;
        }
      }
    }

    return false;
  }
/*
  private isConnectedToOld(a: Polygon, b: Polygon): boolean {
    const vI = a.vertices;
    const vICount = vI.length;

    const vJ = b.vertices;
    const vJCount = vJ.length;

    for (let i = 0; i < vICount; i++) {
      const vi1 = vI[i].pos;

      for (let j = 0; j < vJCount; j++) {
        const vj1 = vJ[j].pos;

        if (vi1.equals(vj1)) {
          const vI2 = i + 1 === vICount ? vI[0].pos : vI[i + 1].pos;

          if (j + 1 == vJCount) {
            if (vI2.equals(vJ[0].pos)) {
              return true;
            }
          } else {
            if (vI2.equals(vJ[(j + 1) % vJCount].pos)) {
              return true;
            }
          }

          if (j === 0) {
            if (vI2.equals(vJ[vJCount - 1].pos)) {
              return true;
            }
          } else {
            if (vI2.equals(vJ[j - 1].pos)) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  private vecsEqual(vi1: Vector, vj1: Vector, vi2: Vector, vj2: Vector): boolean {
    if (vi1.equals(vj1) && vi2.equals(vj2)) {
      return true;
    }

    if (vi1.equals(vj2) && vi2.equals(vj1)) {
      return true;
    }

    return false;
  }*/

  public removeHiddenPolygons(): Csg {
    const polys = this.clone().polygons;

    let polyCount = polys.length;
    for (let i = 0; i < polyCount; i++) {
      const polyi = polys[i];

      let ajacentPolyCount = 0;
      let maxA = 0;
      let removeIndex = 0;

      for (let j = i + 1; j < polyCount; j++) {
        const polyj = polys[j];

        if (this.isConnectedTo(polyi, polyj)) {
          ajacentPolyCount++;

          const n1 = polyi.plane.normal;
          const n2 = polyj.plane.normal;

          const dot = n1.dot(n2);
          const e1 = n1.length();
          const e2 = n2.length();

          const d = dot / (e1 * e2);
          const pi = 3.14159;
          const A = (180 / pi) * Math.acos(d);

          if (A > maxA) {
            maxA = A;
            removeIndex = j;
          }
        }
      }

      if (ajacentPolyCount > 1) {
        polys.splice(removeIndex, 1);
        polyCount--;
        i--;
      }
    }

    return Csg.fromPolygons(polys);
  }

  public toGeometry(): BufferGeometry {
    const polygons = this.toPolygons();

    const indicies: number[] = [];
    const vertexMap = new VertexMap();

    const polygon_count = polygons.length;
    for (let i = 0; i < polygon_count; i++) {
      const polygon = polygons[i];
      const polygon_vertice_count = polygon.vertices.length;

      for (let j = 2; j < polygon_vertice_count; j++) {
        let vertex = polygon.vertices[0];
        vertexMap.add(
          new Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z),
          indicies
        );

        vertex = polygon.vertices[j - 1];
        vertexMap.add(
          new Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z),
          indicies
        );

        vertex = polygon.vertices[j];
        vertexMap.add(
          new Vector3(vertex.pos.x, vertex.pos.y, vertex.pos.z),
          indicies
        );
      }
    }

    const vertexBuffer = new BufferAttribute(
      new Float32Array(vertexMap.vertices),
      3
    );

    let indexArray: Uint32Array | Uint16Array;
    if (vertexBuffer.count > 65535) {
      indexArray = new Uint32Array(indicies.length);
    } else {
      indexArray = new Uint16Array(indicies.length);
    }

    indexArray.set(indicies, 0);
    const indexBuffer = new BufferAttribute(indexArray, 1);

    // Generate the vertex and index buffer - if needed for this part
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", vertexBuffer);
    geometry.setIndex(indexBuffer);

    return geometry;
  }
}
