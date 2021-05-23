import { injectable } from "inversify";

@injectable()
export default class Settings {
  get libraryPath(): string {
    return "library/";
  }
}
