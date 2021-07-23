import PartCommand from "../files/PartCommand";
import LineCommand from "../files/LineCommand";
import TriangleCommand from "../files/TriangleCommand";
import QuadCommand from "../files/QuadCommand";
import Model from "../files/Model";
import MetaCommentCommand from "../files/MetaCommentCommand";
import MetaCommand from "../files/MetaCommand";
import MetaBfcCommand from "../files/MetaBfcCommand";
import LdrModelLoader from "../files/LdrModelLoader";
import LdrColor from "../files/LdrColor";
import OptionalLineCommand from "../files/OptionalLineCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import ColorManager from "../ColorManager";
import { Matrix4, Triangle, Vector3 } from "three";
import TrianglePrimitive from "./trianglePrimitive";
import QuadPrimitive from "./XQuadPrimitive";
import OptionalLinePrimitive from "./optionalLinePrimitive";
import LinePrimitive from "./linePrimitive";
import PartReference from "./partReference";
import PartPrimitives from "./partPrimitives";
import Primitive from "./primitive";

@injectable()
export default class PartTreeFactory {
  private ldrModelLoader!: LdrModelLoader;
  private colorManager!: ColorManager;

  constructor(
    @inject(Symbols.LdrModelLoader) ldrModelLoader: LdrModelLoader,
    @inject(Symbols.ColorManager) colorManager: ColorManager
  ) {
    this.ldrModelLoader = ldrModelLoader;
    this.colorManager = colorManager;
  }

  // https://www.ldraw.org/article/415
  public async generate(model: Model): Promise<PartPrimitives> {
    const t0 = performance.now();
    try {
      // Red when not specified
      const defaultColor = await this.colorManager.resolveColor({ num: 4 });

      return this.generatePart(model, defaultColor);
    } finally {
      const t1 = performance.now();
      console.log(
        "Call to recursiveGenerate took " + (t1 - t0) + " milliseconds."
      );
    }
  }

  public async generatePart(
    model: Model,
    color: LdrColor
  ): Promise<PartPrimitives> {
    // Walk the model structure generating vertex and index lists
    const partList = await this.recursiveGenerate(
      model,
      false,
      new Matrix4(),
      color
    );

    return new PartPrimitives(model.file, partList);
  }

  private async recursiveGenerate(
    model: Model,
    accumInvert: boolean,
    accumTransformMatrix: Matrix4,
    ldrColor: LdrColor
  ): Promise<Primitive[]> {
    const partList: Primitive[] = [];
    let winding = "CCW";
    let invertNext = false;

    // Correct for an inverted accumated transformation matrix by inverting the winding
    const invert = accumTransformMatrix.determinant() < 0;

    for (const command of model.commands) {
      switch (command.lineType) {
        case 0: {
          const metaCommandCommand = command as MetaCommentCommand;
          switch (metaCommandCommand.subType) {
            case "COMMENT": {
              break;
            }

            case "META": {
              const metaCommand = command as MetaCommand;
              switch (metaCommand.metaName) {
                case "BFC": {
                  const bfcCommand = metaCommand as MetaBfcCommand;

                  switch (bfcCommand.bfc.subType) {
                    case "CLIP":
                    case "CERTIFY": {
                      if (bfcCommand.bfc.dir === "CCW") {
                        if (accumInvert) {
                          winding = "CW";
                        } else {
                          winding = "CCW";
                        }
                      } else {
                        if (accumInvert) {
                          winding = "CCW";
                        } else {
                          winding = "CW";
                        }
                      }
                    }
                  }

                  switch (bfcCommand.bfc.subType) {
                    case "INVERTNEXT": {
                      invertNext = true;
                      break;
                    }
                  }

                  break;
                }
              }
              break;
            }
          }

          break;
        }

        case 1: {
          const partCommand = command as PartCommand;
          const part = this.ldrModelLoader.getPart(partCommand.file);

          if (part === null) {
            console.log("ERROR Missing Part - " + partCommand.file);
            continue;
          }

          const partColor =
            partCommand.color.num === 16
              ? ldrColor
              : await this.colorManager.resolveColor(partCommand.color);

          const m = new Matrix4()
            .copy(accumTransformMatrix)
            .multiply(partCommand.matrix);

          const subPartList = await this.recursiveGenerate(
            part,
            accumInvert !== invertNext,
            m,
            partColor
          );

          partList.push(
            new PartReference(
              partCommand,
              new PartPrimitives(partCommand.file, subPartList)
            )
          );

          break;
        }

        case 2: {
          const lineCommand = command as LineCommand;

          const lineColor =
            lineCommand.color.num === 24
              ? ldrColor
              : await this.colorManager.resolveColor(lineCommand.color);

          const p1 = new Vector3()
            .copy(lineCommand.firstPoint)
            .applyMatrix4(accumTransformMatrix);
          const p2 = new Vector3()
            .copy(lineCommand.secondPoint)
            .applyMatrix4(accumTransformMatrix);

          partList.push(new LinePrimitive(lineCommand, lineColor, [p1, p2]));
          break;
        }

        case 3: {
          const triangleCommand = command as TriangleCommand;

          const triangleColor =
            triangleCommand.color.num === 16
              ? ldrColor
              : await this.colorManager.resolveColor(triangleCommand.color);

          const p1 = new Vector3()
            .copy(triangleCommand.firstPoint)
            .applyMatrix4(accumTransformMatrix);
          const p2 = new Vector3()
            .copy(triangleCommand.secondPoint)
            .applyMatrix4(accumTransformMatrix);
          const p3 = new Vector3()
            .copy(triangleCommand.thirdPoint)
            .applyMatrix4(accumTransformMatrix);

          // Create a simple triangle shape respecting the winding indicator
          if ((winding === "CW") === invert) {
            partList.push(
              new TrianglePrimitive(
                triangleCommand,
                triangleColor,
                new Triangle(p1, p2, p3)
              )
            );
          } else {
            partList.push(
              new TrianglePrimitive(
                triangleCommand,
                triangleColor,
                new Triangle(p3, p2, p1)
              )
            );
          }

          break;
        }

        case 4: {
          const quadCommand = command as QuadCommand;

          const quadColor =
            quadCommand.color.num === 16
              ? ldrColor
              : await this.colorManager.resolveColor(quadCommand.color);

          const p1 = new Vector3()
            .copy(quadCommand.firstPoint)
            .applyMatrix4(accumTransformMatrix);
          const p2 = new Vector3()
            .copy(quadCommand.secondPoint)
            .applyMatrix4(accumTransformMatrix);
          const p3 = new Vector3()
            .copy(quadCommand.thirdPoint)
            .applyMatrix4(accumTransformMatrix);
          const p4 = new Vector3()
            .copy(quadCommand.forthPoint)
            .applyMatrix4(accumTransformMatrix);

          // create a simple square shape. We duplicate the top left and bottom right
          // vertices because each vertex needs to appear once per triangle.
          if ((winding === "CW") === invert) {
            partList.push(
              new QuadPrimitive(
                quadCommand,
                quadColor,
                new Triangle(p1, p2, p3),
                new Triangle(p1, p3, p4)
              )
            );
          } else {
            partList.push(
              new QuadPrimitive(
                quadCommand,
                quadColor,
                new Triangle(p3, p2, p1),
                new Triangle(p4, p3, p1)
              )
            );
          }

          break;
        }

        case 5: {
          const optionalLineCommand = command as OptionalLineCommand;

          const optionalLineColor =
            optionalLineCommand.color.num === 24
              ? ldrColor
              : await this.colorManager.resolveColor(optionalLineCommand.color);

          // Transform the points
          const firstPoint = new Vector3()
            .copy(optionalLineCommand.firstPoint)
            .applyMatrix4(accumTransformMatrix);
          const secondPoint = new Vector3()
            .copy(optionalLineCommand.secondPoint)
            .applyMatrix4(accumTransformMatrix);
          const firstControlPoint = new Vector3()
            .copy(optionalLineCommand.firstControlPoint)
            .applyMatrix4(accumTransformMatrix);
          const secondControlPoint = new Vector3()
            .copy(optionalLineCommand.secondControlPoint)
            .applyMatrix4(accumTransformMatrix);

          partList.push(
            new OptionalLinePrimitive(optionalLineCommand, optionalLineColor, [
              firstPoint,
              secondPoint,
              firstControlPoint,
              secondControlPoint
            ])
          );

          break;
        }
      }

      let t = true;
      if (
        command.lineType === 0 &&
        (command as MetaCommentCommand).subType === "META" &&
        (command as MetaCommand).metaName === "BFC"
      ) {
        t = false;
      }

      if (t) {
        invertNext = false;
      }
    }

    return partList;
  }
}
