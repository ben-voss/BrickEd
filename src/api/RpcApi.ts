import { Symbols } from "@/di";
import RpcClient from "@/rpc/RpcClient";
import AppState from "@/store/AppState";
import { inject, injectable } from "inversify";
import { CommitOptions, DispatchOptions } from "vuex";
import Api from "./Api";
import FileInfo from "./FileInfo";
import MessageBoxOptions from "./MessageBoxOptions";

@injectable()
export default class RpcApi implements Api {
  private rpcClient: RpcClient;

  constructor(@inject(Symbols.RpcClient) rpcClient: RpcClient) {
    this.rpcClient = rpcClient;
  }

  public messageBox(options: MessageBoxOptions): Promise<number> {
    return this.rpcClient.call("messageBox", options);
  }

  public save(
    fileName: string,
    fileContent: string,
    contentType: string
  ): Promise<void> {
    return this.rpcClient.call("save", fileName, fileContent, contentType);
  }

  public saveAs(fileContent: string, contentType: string): Promise<string> {
    return this.rpcClient.call("saveAs", fileContent, contentType);
  }

  public open(): Promise<FileInfo | null> {
    return this.rpcClient.call<FileInfo>("open");
  }

  public setRepresentedFilename(fileName: string | null): Promise<void> {
    return this.rpcClient.call("setRepresentedFilename", fileName);
  }

  public readFileAsync(fileName: string): Promise<string> {
    return this.rpcClient.call("readFileAsync", fileName);
  }

  public fileExistsAsync(fileName: string): Promise<boolean> {
    return this.rpcClient.call("fileExistsAsync", fileName);
  }

  public dispatch(
    type: string,
    payload?: any,
    options?: DispatchOptions
  ): Promise<any> {
    return this.rpcClient.call("dispatch", type, payload, options);
  }

  public onCommitAdd(
    fn: (args: { type: string; payload?: any; options?: CommitOptions }) => void
  ): void {
    this.rpcClient.addEvent("commit", fn);
  }

  public onCommitDel(
    fn: (args: { type: string; payload?: any; options?: CommitOptions }) => void
  ): void {
    this.rpcClient.removeEvent("commit", fn);
  }

  public getState(): Promise<AppState> {
    return this.rpcClient.call("getState");
  }
}
