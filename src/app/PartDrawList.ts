import PartCommand from "./files/PartCommand";
import LdrColor from "./files/LdrColor";
import MultiMap from "./utils/MultiMap";
import { Box3, Matrix4, Vector3 } from "three";

export default class PartDrawList {
  // The part command for this draw list
  public command: PartCommand;

  // Untransformed verticies
  public lineVertexesByColor = new MultiMap<LdrColor, Vector3>();
  public optionalLineVertexesByColor = new MultiMap<LdrColor, Vector3[]>();
  public triangleVertexesByColor = new MultiMap<LdrColor, Vector3>();

  // The untransformed bounding box for the part
  public boundingBox: Box3;

  // The matrix for the part model.  Multiply the untransformed
  // vertices by this matrix to get the vertices to be displayed.
  public matrix: Matrix4;

  // The color for this part
  public color: LdrColor;

  // Maps of lines, trangles and optional lines grouped by color.
  // The indexes are the indexes into the central vertex buffer.
  public lineIndexesByColor = new MultiMap<LdrColor, number>();
  public triangleIndexesByColor = new MultiMap<LdrColor, number>();
  public optionalLineBuffersByColor = new MultiMap<LdrColor, number[]>();

  public transformedBoundingBox: Box3;

  constructor(command: PartCommand, matrix: Matrix4, color: LdrColor) {
    this.command = command;
    this.matrix = matrix;
    this.color = color;
    this.boundingBox = new Box3();
    this.transformedBoundingBox = new Box3();
  }
}
