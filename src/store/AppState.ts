import { DocumentState } from "./modules/DocumentState";
import { PartsListState } from "./modules/PartsListState";

export default interface AppState {
  document: DocumentState;
  partsList: PartsListState;
}
