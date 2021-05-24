import "reflect-metadata";
import { createApp } from "vue";
import App from "./App.vue";
import { IpcRenderer } from "electron";

// Create the dependency injection container
import "./di";
import container, { Symbols } from "./di";
import RpcClient from "./rpc/RpcClient";
import RpcApi from "./api/RpcApi";
import LdrColorLoader from "./app/files/LdrColorLoader";
import OpenCommand from "./app/commands/OpenCommand";
import LdrModelLoader from "./app/files/LdrModelLoader";
import Settings from "./app/settings/Settings";
import LdrModelWriter from "./app/files/LdrModelWriter";
import SaveCommand from "./app/commands/SaveCommand";
import AppState from "./store/AppState";
import { Module, Store } from "vuex";
import { interfaces } from "inversify";
import storeFactory from "./store/storeFactory";
import documentStateFactory, {
  DocumentState
} from "./store/modules/DocumentState";

declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}

// Register the dependencies
container.bind(Symbols.RpcClient).toConstantValue(new RpcClient("MAIN"));

container.bind(Symbols.Api).to(RpcApi).inSingletonScope();
container.bind(Symbols.LdrColorLoader).to(LdrColorLoader).inSingletonScope();
container.bind(Symbols.LdrModelLoader).to(LdrModelLoader).inSingletonScope();
container.bind(Symbols.LdrModelWriter).to(LdrModelWriter).inSingletonScope();
container.bind(Symbols.Settings).to(Settings).inSingletonScope();

container
  .bind<Store<AppState>>(Symbols.Store)
  .toDynamicValue((context: interfaces.Context) => {
    return storeFactory(context.container.get(Symbols.DocumentState));
  })
  .inSingletonScope();

container
  .bind<Module<DocumentState, AppState>>(Symbols.DocumentState)
  .toDynamicValue(() => {
    return documentStateFactory();
  })
  .inSingletonScope();

container.bind(Symbols.OpenCommand).to(OpenCommand).inSingletonScope();
container.bind(Symbols.SaveCommand).to(SaveCommand).inSingletonScope();

// Activate the commands so they can hook the IPC message handlers
container.get(Symbols.OpenCommand);
container.get(Symbols.SaveCommand);

// Create the UI
createApp(App).use(container.get(Symbols.Store)).mount("#app");
