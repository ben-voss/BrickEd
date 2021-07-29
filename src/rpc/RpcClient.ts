import { ResponseMessage } from "./ResponseMessage";
import { v1 as uuid } from "uuid";
import { injectable } from "inversify";
import { EventMessage } from "./EventMessage";
import MultiMap from "@/app/utils/MultiMap";

class DeferredPromise {
  public promise: Promise<any>;
  public resolve!: (value?: any) => void;
  public reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

@injectable()
export default class RpcClient {
  private handleResponseMessage = (
    event: Electron.IpcRendererEvent,
    json: string
  ) => this.handleResponse(event, json);

  private handleEventMessage = (
    event: Electron.IpcRendererEvent,
    json: string
  ) => this.handleEvent(event, json);

  private promises = new Map<string, DeferredPromise>();
  private target: string;

  constructor(target: string) {
    this.target = target;

    window.ipcRenderer.on("RPC_RESPONSE", this.handleResponseMessage);
    window.ipcRenderer.on("RPC_EVENT", this.handleEventMessage);
  }

  public dispose(): void {
    window.ipcRenderer.removeListener("RPC_EVENT", this.handleEventMessage);
    window.ipcRenderer.removeListener("RPC_RESPONSE", this.handleResponseMessage);
  }

  public call<T>(method: string, ...args: any): Promise<T> {
    const id = uuid();
    const promise = new DeferredPromise();

    this.promises.set(id, promise);

    window.ipcRenderer.send(
      "RPC",
      JSON.stringify({ id, target: this.target, method, args })
    );

    return promise.promise;
  }

  private eventDelegates = new MultiMap<string, (args: any) => void>();

  public addEvent(id: string, delegate: (args: any) => void): void {
    this.eventDelegates.append(id, delegate);
  }

  public removeEvent(id: string, delegate: (args: any) => void): void {
    this.eventDelegates.remove(id, delegate);
  }

  private handleResponse(
    _event: Electron.IpcRendererEvent,
    json: string
  ): void {
    const response = JSON.parse(json) as ResponseMessage;

    const promise = this.promises.get(response.id);
    if (promise) {
      this.promises.delete(response.id);

      if (response.success) {
        promise.resolve(response.result);
      } else {
        promise.reject(response.result);
      }
    }
  }

  private handleEvent(_event: Electron.IpcRendererEvent, json: string): void {
    const event = JSON.parse(json) as EventMessage;

    const delegates = this.eventDelegates.get(event.id);
    if (delegates) {
      for (const d of delegates) {
        d(event.args);
      }
    }
  }
}
