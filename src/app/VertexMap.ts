import { Vector3 } from "three";

export default class VertexMap {
  private root = new Map<
    number,
    Map<number, Map<number, { index: number; count: number }>>
  >();
  public vertices: number[] = [];
  private unusedIndex = -1;

  // Removes the specified list of vertexes from the map.
  public remove(indexes: number[]): void {
    const v = this.vertices;
    let u = this.unusedIndex;

    // Add all the vertices to the free list
    for (let i of indexes) {
      i *= 3;
      const x = v[i];
      const y = v[i + 1];
      const z = v[i + 2];

      const xMap = this.root.get(x);
      if (xMap === undefined) {
        continue;
      }

      const yMap = xMap.get(y);
      if (yMap === undefined) {
        continue;
      }

      const c = yMap.get(z);
      if (c === undefined) {
        continue;
      }

      if (c.count === 1) {
        yMap.delete(z);
        if (yMap.size === 0) {
          xMap.delete(y);
          if (xMap.size === 0) {
            this.root.delete(x);
          }
        }

        v[i] = u;
        u = i;
      } else {
        c.count--;
      }
    }

    this.unusedIndex = u;
  }

  // Gets or adds the specified vertex to the map and returns
  // its index.
  public add(vertex: Vector3, indices: number[]): void {
    let xMap = this.root.get(vertex.x);
    if (xMap === undefined) {
      xMap = new Map<number, Map<number, { index: number; count: number }>>();
      this.root.set(vertex.x, xMap);
    }

    let yMap = xMap.get(vertex.y);
    if (yMap === undefined) {
      yMap = new Map<number, { index: number; count: number }>();
      xMap.set(vertex.y, yMap);
    }

    let index;
    const pair = yMap.get(vertex.z);
    if (pair === undefined) {
      if (this.unusedIndex === -1) {
        // The vertices array is full
        index = this.vertices.length / 3;

        // The vertex has not yet been recorded.  Add it to the maps
        yMap.set(vertex.z, { index, count: 1 });

        // Add the vertex
        this.vertices.push(vertex.x, vertex.y, vertex.z);
      } else {
        // Use an empty slot
        const next = this.vertices[this.unusedIndex];

        // The vertex will be written at the start of the available slot
        index = this.unusedIndex;

        // Set the vertex values
        this.vertices[index] = vertex.x;
        this.vertices[index + 1] = vertex.y;
        this.vertices[index + 2] = vertex.z;

        // The vertex has not yet been recorded.  Add it to the maps
        index /= 3;
        yMap.set(vertex.z, { index, count: 1 });

        // The next unused index is the start of the next block
        this.unusedIndex = next;
      }
    } else {
      index = pair.index;
      pair.count++;
    }

    // Record the index
    indices.push(index);

    console.assert(this.vertices.length % 3 === 0);
  }

  // Returns the index of vertex in the map or undefined if the
  // vertex does not extist
  public get(vertex: Vector3): number | undefined {
    const xMap = this.root.get(vertex.x);
    if (xMap === undefined) {
      return undefined;
    }

    const yMap = xMap.get(vertex.y);
    if (yMap === undefined) {
      return undefined;
    }

    return yMap.get(vertex.z)?.index;
  }
}
