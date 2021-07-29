import { BrowserWindow, ipcMain } from "electron";
import { MutationPayload } from "vuex";
import { EventMessage } from "./EventMessage";
import { RequestMessage } from "./RequestMessage";
import { ResponseMessage } from "./ResponseMessage";

export default class RpcServer {
  constructor(
    functions: { [methodName: string]: (...args: any) => any },
    scope: string
  ) {
    // If the scope is correct, we attempt to run the corresponding
    // function in the function lib.
    ipcMain.on("RPC", (event, json) => {
      const sendingWindow = BrowserWindow.fromWebContents(event.sender);
      if (!sendingWindow) {
        return;
      }

      const request: RequestMessage = JSON.parse(json);

      if (scope === request.target) {
        const { id, method, args } = request;

        // Create reject/resolve functions
        const resolve = (result: any) => {
          this.ipcResponse(sendingWindow, {
            success: true,
            id,
            result
          });
        };

        const reject = (result: any) => {
          this.ipcResponse(sendingWindow, {
            success: false,
            id,
            result
          });
        };

        const functionFromAlias = functions[method];
        // If we have a function, run it.
        if (functionFromAlias) {
          // Run the function and get the result
          const result = functionFromAlias(sendingWindow, ...args);

          // We wrap the result in Promise.resolve so we can treat
          // it like a promise (even if is not a promise);
          Promise.resolve(result).then(resolve).catch(reject);
        } else {
          reject({ error: "Function not found." });
        }
      }
    });
  }

  private ipcResponse(sendingWindow: BrowserWindow, response: ResponseMessage): void {
    const json = JSON.stringify(response);
    sendingWindow.webContents.send("RPC_RESPONSE", json);
  }

  private ipcEvent(event: string, response: EventMessage): void {
    const json = JSON.stringify(response);
    const openWindows = BrowserWindow.getAllWindows();

    openWindows.forEach(({ webContents }) => {
      webContents.send(event, json);
    });
  }

  public onCommit(mutation: MutationPayload): void {
    this.ipcEvent("RPC_EVENT", {
      id: "commit",
      args: mutation
    });
  }
}
