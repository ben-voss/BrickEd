import { DocumentState } from "./DocumentState";
import { PartsListState } from "./PartsListState";

export default interface MainState {
  document: DocumentState;
  partsList: PartsListState;
}
