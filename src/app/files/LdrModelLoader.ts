import Model from "./Model";
import * as LdrModelGrammar from "./LdrModelGrammar";
import PartCommand from "./PartCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import Settings from "../settings/settings";

@injectable()
export default class LdrModelLoader {
  private readonly _parts = new Map<string, Model | null>();
  private readonly api: Api;
  private readonly settings: Settings;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Settings) settings: Settings
  ) {
    this.api = api;
    this.settings = settings;
  }

  public partCount(): number {
    return this._parts.size;
  }

  public getPart(name: string): Model | null {
    return this._parts.get(name) || null;
  }

  public async load(fileName: string): Promise<Model[]> {
    const part = this._parts.get(fileName);
    if (part) {
      return [part];
    }

    for (const url of this.fileNameToUrls(fileName)) {
      try {
        const path = this.settings.libraryPath + url;

        if (await this.api.fileExistsAsync(path)) {
          const result = await this.api.readFileAsync(path);

          return await this.parse(fileName, result);
        }
      } catch (error) {
        console.error(error);
      }
    }

    return [];
  }

  public async loadString(fileName: string, content: string): Promise<Model[]> {
    return this.parse(fileName, content);
  }

  private async parse(fileName: string, content: string): Promise<Model[]> {
    // Parse the data
    let models: Model[];
    try {
      models = LdrModelGrammar.parse(content) as Model[];
    } catch (e) {
      console.error("Error parsing " + fileName);
      throw e;
    }

    // Single model files will not have an internal file name
    if (models.length === 1 && models[0].file === undefined) {
      models[0].file = fileName;
    }

    // Split into individual models and index them.  This is done first
    // so that we don't try and load them as seperate parts later
    for (const model of models) {
      this._parts.set(model.file, model);
    }

    // Load the referenced parts in all the models
    const promises = [];
    for (const model of models) {
      for (const command of model.commands) {
        if (command.lineType === 1) {
          const partCommand = command as PartCommand;

          if (!this._parts.has(partCommand.file)) {
            // Store an empty entry for the part so we don't load it more than once
            this._parts.set(partCommand.file, null);

            // Async load the part
            promises.push(this.load(partCommand.file));
          }
        }
      }
    }

    // Wait for all the tasks to complete and collect the results.
    const allModels = await Promise.all(promises);
    allModels.forEach((m) => m.push(...m));

    return models;
  }

  private fileNameToUrls(fileName: string): string[] {
    fileName = fileName.toLowerCase();

    fileName = fileName.replace("\\", "/");

    if (!fileName.endsWith(".dat")) {
      return [fileName];
    }

    return [
      "official/parts/" + fileName,
      // "official/p/48/" + fileName,   // Hi-Res polygons
      "official/p/" + fileName,
      "unofficial/parts/" + fileName,
      // "unofficial/p/48/" + fileName,   // Hi-Res polygons
      "unofficial/p/" + fileName
    ];
  }
}
