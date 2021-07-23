import Vuex, { Module, Store } from "vuex";
import AppState from "./AppState";
import { DocumentState } from "./modules/DocumentState";
import { PartsListState } from "./modules/PartsListState";

export default function storeFactory(
  document: Module<DocumentState, AppState>,
  partsList: Module<PartsListState, AppState>
): Store<AppState> {
  const store = new Vuex.Store<AppState>({
    modules: {
      document,
      partsList
    }
  });

  return store;
}
