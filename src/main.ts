import "reflect-metadata";
import { createApp } from "vue";
import App from "./App.vue";
import store from "./store";
import { IpcRenderer } from "electron";

// Create the dependency injection container
import "./di";
import container, { Symbols } from "./di";
import RpcClient from "./rpc/RpcClient";
import RpcApi from "./api/RpcApi";
import LdrColorLoader from "./app/files/LdrColorLoader";

declare global {
  interface Window {
    ipcRenderer: IpcRenderer;
  }
}

// Register the dependencies
container.bind(Symbols.RpcClient).toConstantValue(new RpcClient("MAIN"));

container.bind(Symbols.Api).to(RpcApi).inSingletonScope();
container.bind(Symbols.LdrColorLoader).to(LdrColorLoader).inSingletonScope();

createApp(App).use(store).mount("#app");
