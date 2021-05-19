import Command from "./Command";
import { Vector3 } from "three";

export default interface TriangleCommand extends Command {
  color: number;
  firstPoint: Vector3;
  secondPoint: Vector3;
  thirdPoint: Vector3;
}