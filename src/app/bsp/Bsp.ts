// https://github.com/chandlerprall/ThreeCSG/blob/master/ThreeCSG.js
// https://github.com/evanw/csg.js/blob/master/csg.js

import { BufferAttribute, BufferGeometry, Vector3 } from "three";
import Primitives from "../partTree/Primitive";
import VertexMap from "../VertexMap";
import Node from "./Node";
import Polygon from "./Polygon";

export default class Bsp {
  private tree: Node;

  constructor(partsOrNode: Primitives | Node) {
    if (partsOrNode instanceof Node) {
      this.tree = partsOrNode as Node;
      return;
    }

    const partPrimitives = partsOrNode as Primitives;
    const polygons: Polygon[] = [];

    partPrimitives.collectPolygons(polygons);

    this.tree = new Node(polygons);
  }

  public subtract(other_tree: Bsp): Bsp {
    const a = this.tree.clone();
    const b = other_tree.tree.clone();

    a.invert();
    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());
    a.invert();

    return new Bsp(a);
  }

  public union(other_tree: Bsp): Bsp {
    const a = this.tree.clone();
    const b = other_tree.tree.clone();

    a.clipTo(b);
    b.clipTo(a);
    b.invert();
    b.clipTo(a);
    b.invert();
    a.build(b.allPolygons());

    return new Bsp(a);
  }

  public intersect(other_tree: Bsp): Bsp {
    const a = this.tree.clone();
    const b = other_tree.tree.clone();

    a.invert();
    b.clipTo(a);
    b.invert();
    a.clipTo(b);
    b.clipTo(a);
    a.build(b.allPolygons());
    a.invert();

    return new Bsp(a);
  }

  public toGeometry(): BufferGeometry {
    const polygons = this.tree.allPolygons();

    const indicies: number[] = [];
    const vertexMap = new VertexMap();

    const polygon_count = polygons.length;
    for (let i = 0; i < polygon_count; i++) {
      const polygon = polygons[i];
      const polygon_vertice_count = polygon.vertices.length;

      for (let j = 2; j < polygon_vertice_count; j++) {
        let vertex = polygon.vertices[0];
        vertexMap.add(new Vector3(vertex.x, vertex.y, vertex.z), indicies);

        vertex = polygon.vertices[j - 1];
        vertexMap.add(new Vector3(vertex.x, vertex.y, vertex.z), indicies);

        vertex = polygon.vertices[j];
        vertexMap.add(new Vector3(vertex.x, vertex.y, vertex.z), indicies);
      }
    }

    const vertexBuffer = new BufferAttribute(new Float32Array(vertexMap.vertices), 3);

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
