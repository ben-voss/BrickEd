import Vuex, { Module, Store } from "vuex";
import { DocumentState } from "./DocumentState";
import MainState from "./MainState";
import { PartsListState } from "./PartsListState";

export default function storeFactory(
  document: Module<DocumentState, MainState>,
  partsList: Module<PartsListState, MainState>
): Store<MainState> {
  const store = new Vuex.Store<MainState>({
    modules: {
      document,
      partsList
    }
  });

  return store;
}
