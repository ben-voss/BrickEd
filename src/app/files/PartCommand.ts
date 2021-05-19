import Command from "./Command";
import { Matrix4 } from "three";

export default interface PartCommand extends Command {
  color: number;
  matrix: Matrix4;
  file: string;
}
