import Model from "./Model";
import * as LdrModelGrammar from "./LdrModelGrammar";
import PartCommand from "./PartCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Settings from "../settings/Settings";
import fs from "fs";
import util from "util";
import MainState from "@/main/store/MainState";
import { Store } from "vuex";

const readFileAsync = util.promisify(fs.readFile);
const fileExistsAsync = util.promisify(fs.exists);

@injectable()
export default class LdrModelLoader {
  public store!: Store<MainState>;
  private readonly settings: Settings;

  constructor(@inject(Symbols.Settings) settings: Settings) {
    this.settings = settings;
  }

  public getPart(name: string): Model | null {
    return this.store.state.document.modelCache[name] || null;
  }

  public async load(fileName: string): Promise<Model[]> {
    const part = this.store.state.document.modelCache[fileName];
    if (part) {
      return [part];
    }

    for (const url of this.fileNameToUrls(fileName)) {
      try {
        const path = this.settings.libraryPath + url;

        if (await fileExistsAsync(path)) {
          const result = await readFileAsync(path);

          return await this.parse(fileName, result.toString());
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
      await this.store.dispatch("document/addModelCache", {
        file: model.file,
        model: model
      });
    }

    // Load the referenced parts in all the models
    const promises = [];
    for (const model of models) {
      for (const command of model.commands) {
        if (command.lineType === 1) {
          const partCommand = command as PartCommand;

          // Store an empty entry for the part so we don't load it more than once
          if (!this.store.state.document.modelCache[partCommand.file]) {
            // Store an empty entry for the part so we don't load it more than once
            await this.store.dispatch("document/addModelCache", {
              file: partCommand.file,
              model: null
            });

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
