import LdrTextureArgs from "./LdrTextureArgs";

export default interface LdrColor {
  name: string;
  code: number;
  value: number;
  edge: number;
  alpha?: number;
  luminance?: number;
  texture?: string;
  args?: LdrTextureArgs;
}
