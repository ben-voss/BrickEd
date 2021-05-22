import RpcServer from "@/rpc/RpcServer";
import fs from "fs";
import util from "util";
import { app, BrowserWindow, dialog } from "electron";
import path from "path";
import MessageBoxOptions from "@/api/MessageBoxOptions";

const writeFileAsync = util.promisify(fs.writeFile);
const readFileAsync = util.promisify(fs.readFile);
const fileExistsAsync = util.promisify(fs.exists);

export default class RpcController {
  private rpcServer: RpcServer;

  constructor() {
    // Setup the RPC server
    const functions = {
      messageBox: async (
        browserWindow: BrowserWindow,
        options: MessageBoxOptions
      ) => await this.messageBox(browserWindow, options),
      save: async (_: BrowserWindow, fileName: string, content: string) =>
        await writeFileAsync(fileName, content),
      saveAs: async (
        browserWindow: BrowserWindow,
        content: string,
        contentType: string
      ) => await this.saveAs(browserWindow, content, contentType),
      open: async (browserWindow: BrowserWindow) =>
        await this.open(browserWindow),
      setRepresentedFilename: async (
        browserWindow: BrowserWindow,
        fileName: string
      ) => await this.setRepresentedFilename(browserWindow, fileName),
      readFileAsync: async (browserWindow: BrowserWindow, fileName: string) =>
        (await readFileAsync(fileName)).toString(),
      fileExistsAsync: async (browserWindow: BrowserWindow, fileName: string) =>
        await fileExistsAsync(fileName)
    };

    this.rpcServer = new RpcServer(functions, "MAIN");
  }

  private async setRepresentedFilename(
    browserWindow: BrowserWindow,
    fileName: string
  ): Promise<void> {
    if (fileName) {
      browserWindow.title = path.basename(fileName) + " - " + app.name;
      browserWindow.setRepresentedFilename(fileName);
    } else {
      browserWindow.title = app.name;
      browserWindow.setRepresentedFilename("");
    }
  }

  private async open(
    browserWindow: BrowserWindow
  ): Promise<{ name: string; content: string } | null> {
    const r = await dialog.showOpenDialog(browserWindow, {
      properties: ["openFile"],
      filters: [{ name: "Model Files", extensions: ["ldr"] }]
    });

    if (r.canceled || r.filePaths.length === 0) {
      return null;
    }

    const content = await readFileAsync(r.filePaths[0]);

    return {
      name: r.filePaths[0],
      content: content.toString()
    };
  }

  private async saveAs(
    browserWindow: BrowserWindow,
    content: string,
    contentType: string
  ): Promise<string | null> {
    const result = await dialog.showSaveDialog(browserWindow, {
      properties: [],
      filters: [{ name: "Model Files", extensions: [contentType] }]
    });

    if (result.canceled || !result.filePath) {
      return null;
    }

    await writeFileAsync(result.filePath, content);

    return result.filePath;
  }

  private async messageBox(
    browserWindow: BrowserWindow,
    options: MessageBoxOptions
  ): Promise<number> {
    const response = await dialog.showMessageBox(browserWindow, options);

    return response.response;
  }
}
