import MetaCommand from "./MetaCommand";
import Bfc from "./Bfc";

export default interface MetaBfcCommand extends MetaCommand {
  bfc: Bfc;
}
