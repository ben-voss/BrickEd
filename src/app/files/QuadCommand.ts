import Command from "./Command";
import { Vector3 } from "three";
import ColorReference from "./ColorReference";

export default interface QuadCommand extends Command {
  color: ColorReference;
  firstPoint: Vector3;
  secondPoint: Vector3;
  thirdPoint: Vector3;
  forthPoint: Vector3;
}
