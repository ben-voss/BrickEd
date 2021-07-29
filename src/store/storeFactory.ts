import Api from "@/api/Api";
import { DocumentState } from "@/main/store/DocumentState";
import { PartsListState } from "@/main/store/PartsListState";
import Vuex, { DispatchOptions, Module, Store } from "vuex";
import AppState from "./AppState";
import { RenderState } from "./modules/RenderState";

const dispatchForwarder = async (store: Store<AppState>, api: Api) => {
  // Re-wire vuex to send calls to dispatch actions to the main process
  const dispatch = store.dispatch;
  store.dispatch = (
    type: string,
    payload?: any,
    options?: DispatchOptions | undefined
  ) => {
    const index = type.indexOf("/");
    const namespace = type.substr(0, index);

    if (namespace === "document" || namespace === "partsList") {
      return api.dispatch(type, payload, options);
    } else {
      return dispatch(type, payload, options);
    }
  };

  // Connect commit notifications from the main process into the renderer state store.
  api.onCommitAdd(
    (args: {
      type: string;
      payload?: any;
      options?: DispatchOptions | undefined;
    }) => {
      store.commit(args.type, args.payload, args.options);
    }
  );

  // Apply the initial state by loading it from the main process and applying it over
  // the top of any renderer process state
  const mainState = await api.getState();
  const newState = { ...store.state, ...mainState };

  store.replaceState(newState);
};

export default function storeFactory(
  document: Module<DocumentState, AppState>,
  partsList: Module<PartsListState, AppState>,
  render: Module<RenderState, AppState>,
  api: Api
): Store<AppState> {
  const store = new Vuex.Store<AppState>({
    modules: {
      document,
      partsList,
      render
    },
    plugins: [(store) => dispatchForwarder(store, api)]
  });

  return store;
}
