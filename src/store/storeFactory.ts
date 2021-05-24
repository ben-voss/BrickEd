import Vuex, { Module, Store } from "vuex";
import AppState from "./AppState";
import { DocumentState } from "./modules/DocumentState";

//Vue.use(Vuex);

export default function storeFactory(
  document: Module<DocumentState, AppState>
): Store<AppState> {
  const store = new Vuex.Store<AppState>({
    modules: {
      document
    }
  });

  return store;
}
