import AppState from "@/store/AppState";
import { MessageBoxOptions } from "electron";
import { CommitOptions, Dispatch } from "vuex";
import FileInfo from "./FileInfo";

export default interface Api {
  messageBox(options: MessageBoxOptions): Promise<number>;

  save(
    fileName: string,
    fileContent: string,
    contentType: string
  ): Promise<void>;

  saveAs(fileContent: string, contentType: string): Promise<string>;

  open(): Promise<FileInfo | null>;

  setRepresentedFilename(fileName: string | null): Promise<void>;

  readFileAsync(fileName: string): Promise<string>;

  fileExistsAsync(fileName: string): Promise<boolean>;

  dispatch: Dispatch;

  onCommitAdd(
    fn: (args: { type: string; payload?: any; options?: CommitOptions }) => void
  ): void;

  onCommitDel(
    fn: (args: { type: string; payload?: any; options?: CommitOptions }) => void
  ): void;

  getState(): Promise<AppState>;
}
