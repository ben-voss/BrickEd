import Command from "./Command";
import { Vector3 } from "three";
import ColorReference from "./ColorReference";

export default interface OptionalLineCommand extends Command {
  color: ColorReference;
  firstPoint: Vector3;
  secondPoint: Vector3;
  firstControlPoint: Vector3;
  secondControlPoint: Vector3;
}
