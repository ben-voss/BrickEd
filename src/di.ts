import getDecorators from "inversify-inject-decorators";
import { Container } from "inversify";
const container = new Container({ skipBaseClassChecks: true });

const { lazyInject } = getDecorators(container);
export { lazyInject as LazyInject };

export default container;

export const Symbols = {
  RpcClient: Symbol.for("RpcClient"),
  Api: Symbol.for("Api"),
  LdrColorLoader: Symbol.for("LdrColorLoader"),
  LdrModelLoader: Symbol.for("LdrModelLoader"),
  LdrModelWriter: Symbol.for("LdrModelWriter"),
  Settings: Symbol.for("Settings"),
  Store: Symbol.for("Store"),
  DocumentState: Symbol.for("DocumentState"),
  PartsListState: Symbol.for("PartsListState"),
  ColorManager: Symbol.for("ColorManager"),
  RenderModelFactory: Symbol.for("RenderModelFactory"),
  PartTreeFactory: Symbol.for("PartTreeFactory"),

  OpenCommand: Symbol.for("OpenCommand"),
  SaveCommand: Symbol.for("SaveCommand")
};
