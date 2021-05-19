import MetaCommentCommand from "./MetaCommentCommand";

export default interface WriteMetaCommand extends MetaCommentCommand {
  write: string;
}
