import Command from "./Command";
import { Vector3 } from "three";

export default interface LineCommand extends Command {
  color: number;
  firstPoint: Vector3;
  secondPoint: Vector3;
}
