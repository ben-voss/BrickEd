import Model from "../../app/files/Model";
import Command from "../../app/files/Command";
import MetaCommand from "../../app/files/MetaCommand";

export interface TreeNode {
  id: number;
  name: string;
  children: TreeNode[];
  ref: null | Model | Command | MetaCommand;
  isSelected: boolean;
}
