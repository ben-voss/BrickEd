import PartCommand from "./files/PartCommand";
import LineCommand from "./files/LineCommand";
import TriangleCommand from "./files/TriangleCommand";
import QuadCommand from "./files/QuadCommand";
import Model from "./files/Model";
import MetaCommentCommand from "./files/MetaCommentCommand";
import MetaCommand from "./files/MetaCommand";
import MetaBfcCommand from "./files/MetaBfcCommand";
import LdrColor from "./files/LdrColor";
import OptionalLineCommand from "./files/OptionalLineCommand";
import RenderModel from "./RenderModel";
import PartDrawList from "./PartDrawList";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import ColorManager from "./ColorManager";
import { Matrix4, Vector3 } from "three";
import { markRaw } from "vue";
import AppState from "@/store/AppState";
import { Store } from "vuex";

@injectable()
export default class RenderModelFactory {
  private colorManager!: ColorManager;
  private store: Store<AppState>;

  constructor(
    @inject(Symbols.ColorManager) colorManager: ColorManager,
    @inject(Symbols.Store) store: Store<AppState>
  ) {
    this.colorManager = colorManager;
    this.store = store;
  }

  // https://www.ldraw.org/article/415
  public async generate(model: Model): Promise<RenderModel> {
    const t0 = performance.now();

    const partDrawLists: PartDrawList[] = [];

    // Walk the model structure generating vertex and index lists
    await this.recursiveGenerate(
      partDrawLists,
      model,
      false,
      false,
      new Matrix4(),
      await this.colorManager.resolveColor({ num: 4 }), // Red when not specified
      null
    );

    const t1 = performance.now();
    console.log(
      "Call to recursiveGenerate took " + (t1 - t0) + " milliseconds."
    );

    const t2 = performance.now();

    // Calculate the bounding boxes
    for (let i = partDrawLists.length - 1; i >= 0; i--) {
      this.calculateBoundingBox(partDrawLists[i]);
    }

    const t3 = performance.now();
    console.log(
      "Call to calculate bounding boxes took " + (t3 - t2) + " milliseconds."
    );

    return markRaw(new RenderModel(partDrawLists));
  }

  private calculateBoundingBox(partDrawList: PartDrawList): void {
    // To save some time, only use the trangle vertexes to build the
    // bounds.  We assume there are no parts that are defined using
    // lines that protrude from the part faces.
    for (const [, vertexes] of partDrawList.triangleVertexesByColor) {
      for (let i = vertexes.length - 1; i >= 0; i--) {
        partDrawList.boundingBox.expandByPoint(vertexes[i]);
      }
    }
  }

  public async generatePart(
    model: Model,
    color: LdrColor
  ): Promise<PartDrawList> {
    const partDrawLists: PartDrawList[] = [];
    const partDrawList = new PartDrawList(
      {
        lineType: 1,
        color: { num: color.code, direct: undefined },
        matrix: new Matrix4(),
        file: model.file
      },
      new Matrix4(),
      await this.colorManager.resolveColor({ num: 4 })
    );

    // Walk the model structure generating vertex and index lists
    await this.recursiveGenerate(
      partDrawLists,
      model,
      false,
      false,
      new Matrix4(),
      color,
      partDrawList
    );

    this.calculateBoundingBox(partDrawList);

    return partDrawList;
  }

  private async recursiveGenerate(
    partDrawLists: PartDrawList[],
    model: Model,
    accumCull: boolean,
    accumInvert: boolean,
    accumTransformMatrix: Matrix4,
    ldrColor: LdrColor,
    partDrawList: PartDrawList | null
  ): Promise<PartDrawList> {
    let isRootModel = false;

    if (!partDrawList) {
      partDrawList = new PartDrawList(
        {
          lineType: 0,
          color: { num: 0, direct: undefined },
          matrix: new Matrix4(),
          file: model.file
        },
        accumTransformMatrix,
        ldrColor
      );
      isRootModel = true;
    }

    let localCull = true;
    let winding = "CCW";
    let certified: boolean | null = null;
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
                    case "CERTIFY": {
                      if (certified === false) {
                        console.log(
                          "ERROR: Certified is already false in part " +
                            model.file
                        );
                      }

                      certified = true;
                      break;
                    }
                    case "NOCERTIFY": {
                      if (certified === true) {
                        console.log(
                          "ERROR: Certified is already true in part " +
                            model.file
                        );
                      }

                      certified = false;
                      break;
                    }
                    case "CLIP": {
                      localCull = true;
                      break;
                    }
                    case "NOCLIP": {
                      localCull = false;
                      break;
                    }
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
          const part = this.store.state.document.modelCache[partCommand.file];
          if (!part) {
            console.log("ERROR Missing Part - " + partCommand.file);
            continue;
          }

          if (certified === null) {
            certified = false;
          }

          const partColor =
            partCommand.color.num === 16
              ? ldrColor
              : await this.colorManager.resolveColor(partCommand.color);

          let subPartDrawList: PartDrawList;
          if (isRootModel) {
            subPartDrawList = new PartDrawList(
              partCommand,
              new Matrix4()
                .copy(accumTransformMatrix)
                .multiply(partCommand.matrix),
              ldrColor
            );
            partDrawLists.push(subPartDrawList);
          } else {
            subPartDrawList = partDrawList;
          }

          let m: Matrix4;

          if (isRootModel) {
            m = new Matrix4().identity();
          } else {
            m = new Matrix4()
              .copy(accumTransformMatrix)
              .multiply(partCommand.matrix);
          }

          if (certified) {
            await this.recursiveGenerate(
              partDrawLists,
              part,
              accumCull && localCull,
              accumInvert !== invertNext,
              m,
              partColor,
              subPartDrawList
            );
          } else {
            await this.recursiveGenerate(
              partDrawLists,
              part,
              false,
              accumInvert !== invertNext,
              m,
              partColor,
              subPartDrawList
            );
          }

          break;
        }

        case 2: {
          const lineCommand = command as LineCommand;

          if (certified === null) {
            certified = false;
          }

          const lineColor =
            lineCommand.color.num === 24
              ? ldrColor
              : await this.colorManager.resolveColor(lineCommand.color);

          partDrawList.lineVertexesByColor.append(
            lineColor,
            new Vector3()
              .copy(lineCommand.firstPoint)
              .applyMatrix4(accumTransformMatrix),
            new Vector3()
              .copy(lineCommand.secondPoint)
              .applyMatrix4(accumTransformMatrix)
          );
          break;
        }

        case 3: {
          const triangleCommand = command as TriangleCommand;

          if (certified === null) {
            certified = false;
          }

          /*if (accumCull && localCull && (certified === true)) {
              if (bfc(command, accumTransformMatrix, winding) {
                // Render Command
              } else {
              //   Don't render Command
              }
            } else {
              //  Render Command
            }*/

          const triangleColor =
            triangleCommand.color.num === 16
              ? ldrColor
              : await this.colorManager.resolveColor(triangleCommand.color);

          // Create a simple triangle shape respecting the winding indicator
          if ((winding === "CW") === invert) {
            partDrawList.triangleVertexesByColor.append(
              triangleColor,
              new Vector3()
                .copy(triangleCommand.firstPoint)
                .applyMatrix4(accumTransformMatrix),
              new Vector3()
                .copy(triangleCommand.secondPoint)
                .applyMatrix4(accumTransformMatrix),
              new Vector3()
                .copy(triangleCommand.thirdPoint)
                .applyMatrix4(accumTransformMatrix)
            );
          } else {
            partDrawList.triangleVertexesByColor.append(
              triangleColor,
              new Vector3()
                .copy(triangleCommand.thirdPoint)
                .applyMatrix4(accumTransformMatrix),
              new Vector3()
                .copy(triangleCommand.secondPoint)
                .applyMatrix4(accumTransformMatrix),
              new Vector3()
                .copy(triangleCommand.firstPoint)
                .applyMatrix4(accumTransformMatrix)
            );
          }

          break;
        }

        case 4: {
          const quadCommand = command as QuadCommand;

          if (certified === null) {
            certified = false;
          }

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
            partDrawList.triangleVertexesByColor.append(
              quadColor,
              p1,
              p2,
              p3,
              p1,
              p3,
              p4
            );
          } else {
            partDrawList.triangleVertexesByColor.append(
              quadColor,
              p3,
              p2,
              p1,
              p4,
              p3,
              p1
            );
          }

          break;
        }

        case 5: {
          const optionalLineCommand = command as OptionalLineCommand;

          if (certified === null) {
            certified = false;
          }

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

          // Obtain/create the buffers
          let optionalLineBuffers =
            partDrawList.optionalLineVertexesByColor.get(optionalLineColor);

          if (!optionalLineBuffers) {
            optionalLineBuffers = [[], [], [], []];
            partDrawList.optionalLineVertexesByColor.set(
              optionalLineColor,
              optionalLineBuffers
            );
          }

          const optionalLineVertexBuffer1 = optionalLineBuffers[0];
          const optionalLineVertexBuffer2 = optionalLineBuffers[1];
          const optionalLineControlBuffer1 = optionalLineBuffers[2];
          const optionalLineControlBuffer2 = optionalLineBuffers[3];

          optionalLineVertexBuffer1.push(firstPoint, secondPoint);
          optionalLineVertexBuffer2.push(secondPoint, firstPoint);
          optionalLineControlBuffer1.push(firstControlPoint, firstControlPoint);
          optionalLineControlBuffer2.push(
            secondControlPoint,
            secondControlPoint
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

    return partDrawList;
  }
}
