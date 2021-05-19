import MetaCommentCommand from "./MetaCommentCommand";

export default interface CommentCommand extends MetaCommentCommand {
  hasSlashes: boolean;
  comment: string;
}
