import { MessageBoxOptions } from "electron";
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
}
