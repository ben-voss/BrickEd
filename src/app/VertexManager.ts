import VertexMap from "./VertexMap";
import LdrColor from "./files/LdrColor";
import PartDrawList from "./PartDrawList";
import { BufferAttribute, Matrix4, Vector3 } from "three";

export class VertexManagerColor {
  private tempVector: Vector3;

  private verticiesMap: VertexMap;
  private lineIndexes: number[];
  private triangleIndexes: number[];

  constructor(
    tempVector: Vector3,
    verticiesMap: VertexMap,
    lineIndexes: number[],
    triangleIndexes: number[]
  ) {
    this.tempVector = tempVector;
    this.verticiesMap = verticiesMap;
    this.lineIndexes = lineIndexes;
    this.triangleIndexes = triangleIndexes;
  }

  public addLine(point: Vector3, matrix: Matrix4): void {
    this.verticiesMap.add(
      this.tempVector.copy(point).applyMatrix4(matrix),
      this.lineIndexes
    );
  }

  public addTriangle(point: Vector3, matrix: Matrix4): void {
    this.verticiesMap.add(
      this.tempVector.copy(point).applyMatrix4(matrix),
      this.triangleIndexes
    );
  }
}

export default class VertexManager {
  private tempVector: Vector3 = new Vector3();

  // All the vertices, grouped by color and a map to find positions of vertex values quickly
  //private verticiesByColor = new Map<LdrColor, number[]>();
  private verticiesByColorMap = new Map<LdrColor, VertexMap>();

  private getOrMake(map: Map<LdrColor, number[]>, key: LdrColor): number[] {
    let value = map.get(key);
    if (value === undefined) {
      value = [];
      map.set(key, value);
    }

    return value;
  }

  private getOrMakeMap(
    map: Map<LdrColor, VertexMap>,
    key: LdrColor
  ): VertexMap {
    let value = map.get(key);
    if (value === undefined) {
      value = new VertexMap();
      map.set(key, value);
    }

    return value;
  }

  public makeVertexBuffers(): Map<LdrColor, BufferAttribute> {
    const vertexBuffersByColor = new Map<LdrColor, BufferAttribute>();

    for (const [color, vertices] of this.verticiesByColorMap) {
      console.assert(vertices.vertices.length % 3 === 0);

      vertexBuffersByColor.set(
        color,
        new BufferAttribute(new Float32Array(vertices.vertices), 3)
      );
    }

    return vertexBuffersByColor;
  }

  public getColorManager(
    ldrColor: LdrColor,
    partDrawList: PartDrawList
  ): VertexManagerColor {
    const verticiesMap = this.getOrMakeMap(this.verticiesByColorMap, ldrColor);

    const lineIndexes = this.getOrMake(
      partDrawList.lineIndexesByColor,
      ldrColor
    );
    const triangleIndexes = this.getOrMake(
      partDrawList.triangleIndexesByColor,
      ldrColor
    );

    return new VertexManagerColor(
      this.tempVector,
      verticiesMap,
      lineIndexes,
      triangleIndexes
    );
  }

  public remove(partDrawList: PartDrawList): void {
    for (const [color, line] of partDrawList.lineIndexesByColor) {
      const vm = this.verticiesByColorMap.get(color);
      if (vm) {
        vm.remove(line);
      }

      line.length = 0;
    }

    for (const [color, line] of partDrawList.triangleIndexesByColor) {
      const vm = this.verticiesByColorMap.get(color);
      if (vm) {
        vm.remove(line);
      }

      line.length = 0;
    }

    for (const [, l] of partDrawList.optionalLineBuffersByColor) {
      l[0].length = 0;
      l[1].length = 0;
      l[2].length = 0;
      l[3].length = 0;
    }
  }
}
