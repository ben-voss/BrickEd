import Command from "./Command";
import { Vector3 } from "three";

export default interface OptionalLineCommand extends Command {
  color: number;
  firstPoint: Vector3;
  secondPoint: Vector3;
  firstControlPoint: Vector3;
  secondControlPoint: Vector3;
}
