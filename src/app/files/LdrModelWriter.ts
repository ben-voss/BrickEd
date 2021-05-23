import Model from "./Model";
import MetaCommentCommand from "./MetaCommentCommand";
import PartCommand from "./PartCommand";
import LineCommand from "./LineCommand";
import TriangleCommand from "./TriangleCommand";
import QuadCommand from "./QuadCommand";
import MetaCommand from "./MetaCommand";
import OptionalLineCommand from "./OptionalLineCommand";
import MetaBfcCommand from "./MetaBfcCommand";
import CommentCommand from "./CommentCommand";
import NameMetaCommand from "./NameMetaCommand";
import AuthorMetaCommand from "./AuthorMetaCommand";
import WriteMetaCommand from "./WriteMetaCommand";
import ExtendedMetaCommand from "./ExtendedMetaCommand";
import { injectable } from "inversify";
import ColorReference from "./ColorReference";

@injectable()
export default class LdrModelWriter {
  public write(models: Model[]): string {
    let buffer = "";

    for (let i = 0; i < models.length; i++) {
      const model = models[i];
      for (let j = 0; j < model.commands.length; j++) {
        const command = model.commands[j];

        buffer += command.lineType;
        switch (command.lineType) {
          case 0: {
            const metaCommentCommand = command as MetaCommentCommand;
            switch (metaCommentCommand.subType) {
              case undefined: {
                break;
              }

              case "META": {
                const metaCommand = metaCommentCommand as MetaCommand;

                buffer += " " + metaCommand.metaName;
                switch (metaCommand.metaName) {
                  case "NAME": {
                    const nameMetaCommand =
                      metaCommentCommand as NameMetaCommand;
                    buffer += " " + nameMetaCommand.name;
                    break;
                  }

                  case "AUTHOR": {
                    const authorMetaCommand =
                      metaCommentCommand as AuthorMetaCommand;
                    buffer += " " + authorMetaCommand.author;
                    break;
                  }

                  case "WRITE": {
                    const writeMetaCommand =
                      metaCommentCommand as WriteMetaCommand;
                    buffer += " " + writeMetaCommand.write;
                    break;
                  }

                  case "!": {
                    const extendedMetaCommand =
                      metaCommentCommand as ExtendedMetaCommand;
                    buffer += extendedMetaCommand.value;
                    break;
                  }

                  case "BFC": {
                    const metaBfcCommand = command as MetaBfcCommand;

                    switch (metaBfcCommand.bfc.subType) {
                      case "CLIP": {
                        if (metaBfcCommand.bfc.clip) {
                          buffer += " " + metaBfcCommand.bfc.dir + " CLIP";
                        }

                        break;
                      }

                      case "INVERTNEXT":
                      case "NOCLIP": {
                        buffer += " " + metaBfcCommand.bfc.subType;
                        break;
                      }

                      case "CERTIFY": {
                        if (!metaBfcCommand.bfc.certified) {
                          buffer += " NOCERTIFY";
                        } else if (!metaBfcCommand.bfc.implied) {
                          buffer += " CERTIFY " + metaBfcCommand.bfc.dir;
                        }
                        break;
                      }
                    }

                    break;
                  }
                }
                break;
              }

              case "COMMENT": {
                const commentCommand = metaCommentCommand as CommentCommand;

                if (commentCommand.hasSlashes) {
                  buffer += " //";
                }

                buffer += " " + commentCommand.comment;

                break;
              }

              default: {
                throw (
                  "Unrecognised meta subType '" +
                  metaCommentCommand.subType +
                  "'."
                );
              }
            }
            break;
          }

          case 1: {
            const partCommand = command as PartCommand;
            buffer += this.appendColor(partCommand.color);
            buffer += this.appendMatrix(partCommand.matrix);
            buffer += " " + partCommand.file;
            break;
          }

          case 2: {
            const lineCommand = command as LineCommand;
            buffer += this.appendColor(lineCommand.color);
            buffer += this.appendVector(lineCommand.firstPoint);
            buffer += this.appendVector(lineCommand.secondPoint);
            break;
          }

          case 3: {
            const lineCommand = command as TriangleCommand;
            buffer += this.appendColor(lineCommand.color);
            buffer += this.appendVector(lineCommand.firstPoint);
            buffer += this.appendVector(lineCommand.secondPoint);
            buffer += this.appendVector(lineCommand.thirdPoint);
            break;
          }

          case 4: {
            const quadCommand = command as QuadCommand;
            buffer += this.appendColor(quadCommand.color);
            buffer += this.appendVector(quadCommand.firstPoint);
            buffer += this.appendVector(quadCommand.secondPoint);
            buffer += this.appendVector(quadCommand.thirdPoint);
            buffer += this.appendVector(quadCommand.forthPoint);
            break;
          }

          case 5: {
            const optionalLineCommand = command as OptionalLineCommand;
            buffer += this.appendColor(optionalLineCommand.color);
            buffer += this.appendVector(optionalLineCommand.firstPoint);
            buffer += this.appendVector(optionalLineCommand.secondPoint);
            buffer += this.appendVector(optionalLineCommand.firstControlPoint);
            buffer += this.appendVector(optionalLineCommand.secondControlPoint);
            break;
          }
        }

        buffer += "\n";
      }
    }

    return buffer;
  }

  private appendColor(color: ColorReference): string {
    if (color.num !== undefined) {
      return " " + color.num;
    } else if (color.direct !== undefined) {
      return " 0x2" + color.direct.toString(16).padStart(6, "0");
    } else {
      throw "Unrecognised color reference " + JSON.stringify(color);
    }
  }

  private appendMatrix(matrix: THREE.Matrix4) {
    let buffer = "";
    buffer += " " + matrix.elements[12]; // x
    buffer += " " + matrix.elements[13]; // y
    buffer += " " + matrix.elements[14]; // z
    buffer += " " + matrix.elements[0]; // a
    buffer += " " + matrix.elements[4]; // b
    buffer += " " + matrix.elements[8]; // c
    buffer += " " + matrix.elements[1]; // d
    buffer += " " + matrix.elements[5]; // e
    buffer += " " + matrix.elements[9]; // f
    buffer += " " + matrix.elements[2]; // g
    buffer += " " + matrix.elements[6]; // h
    buffer += " " + matrix.elements[10]; // i
    return buffer;
  }

  private appendVector(vector: THREE.Vector3) {
    let buffer = "";
    buffer += " " + vector.x;
    buffer += " " + vector.y;
    buffer += " " + vector.z;
    return buffer;
  }
}
