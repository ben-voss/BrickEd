import Command from "./Command";
import { Matrix4 } from "three";
import ColorReference from "./ColorReference";

export default interface PartCommand extends Command {
  color: ColorReference;
  matrix: Matrix4;
  file: string;
}
