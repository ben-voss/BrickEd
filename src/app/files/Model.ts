import PartCommand from "./PartCommand";
import LineCommand from "./LineCommand";
import TriangleCommand from "./TriangleCommand";
import QuadCommand from "./QuadCommand";
import OptionalLineCommand from "./OptionalLineCommand";
import MetaCommand from "./MetaCommand";
import MetaCommentCommand from "./MetaCommentCommand";
import MetaBfcCommand from "./MetaBfcCommand";

export default interface Model {
  file: string;
  commands: (
    | MetaCommentCommand
    | MetaBfcCommand
    | MetaCommand
    | PartCommand
    | LineCommand
    | TriangleCommand
    | QuadCommand
    | OptionalLineCommand
  )[];
}
