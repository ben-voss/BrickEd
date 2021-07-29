import { DocumentState } from "@/main/store/DocumentState";
import { PartsListState } from "@/main/store/PartsListState";
import { RenderState } from "./modules/RenderState";

export default interface AppState {
  document: DocumentState;
  partsList: PartsListState;
  render: RenderState;
}
