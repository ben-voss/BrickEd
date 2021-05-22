import Command from "./Command";
import { Vector3 } from "three";
import ColorReference from "./ColorReference";

export default interface LineCommand extends Command {
  color: ColorReference;
  firstPoint: Vector3;
  secondPoint: Vector3;
}
