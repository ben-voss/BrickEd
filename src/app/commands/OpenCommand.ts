import Command from "./Command";
import BaseCommand from "./BaseCommand";
import { inject, injectable } from "inversify";
import { Symbols } from "@/di";
import Api from "@/api/Api";
import LdrModelLoader from "../files/LdrModelLoader";
import { Store } from "vuex";
import AppState from "@/store/AppState";
import RenderModelFactory from "../RenderModelFactory";
import PartTreeFactory from "../partTree/partTreeFactory";
import Bsp from "../bsp/Bsp";
import { Group, Mesh, Scene } from "three";
import Csg from "../csg/Csg";
import Polygon from "../csg/Polygon";

@injectable()
export default class OpenCommand extends BaseCommand implements Command {
  private readonly api: Api;
  private readonly store: Store<AppState>;
  private readonly ldrModelLoader: LdrModelLoader;
  private readonly renderModelFactory: RenderModelFactory;
  private readonly partTreeFactory: PartTreeFactory;

  constructor(
    @inject(Symbols.Api) api: Api,
    @inject(Symbols.Store) store: Store<AppState>,
    @inject(Symbols.LdrModelLoader) ldrModelLoader: LdrModelLoader,
    @inject(Symbols.RenderModelFactory) renderModelFactory: RenderModelFactory,
    @inject(Symbols.PartTreeFactory) partTreeFactory: PartTreeFactory
  ) {
    super("open", "Open", "");

    this.api = api;
    this.store = store;
    this.ldrModelLoader = ldrModelLoader;
    this.renderModelFactory = renderModelFactory;
    this.partTreeFactory = partTreeFactory;
  }

  public ipcRendererAction(args: string[]): void {
    this.openFile(args[0], args[1]);
  }

  public async action(): Promise<void> {
    const file = await this.api.open();

    if (!file) {
      return;
    }

    this.openFile(file.name, file.content);
  }

  private async openFile(fileName: string, content: string): Promise<void> {
    const modelPromise = this.ldrModelLoader.loadString(fileName, content);

    this.store.dispatch("document/setIsDirty", { isDirty: false });
    this.store.dispatch("document/setFileName", { fileName: fileName });
    this.api.setRepresentedFilename(fileName);

    const model = await modelPromise;
    const renderModel = await this.renderModelFactory.generate(model[0]);

    const partPrimitive = await this.partTreeFactory.generate(model[0]);

/*
    let bsp = null;
    for (let i = partPrimitive.primitives.length - 1; i >= 0; i--) {
      const b = new Bsp(partPrimitive.primitives[i]);

      if (bsp === null) {
        bsp = b;
      } else {
        bsp = bsp.union(b);
      }
    }

    if (bsp) {
      const geometry = bsp.toGeometry();
      renderModel.add(geometry);
    }*/


    let csg = null;
    //let cb = null;

    for (let i = partPrimitive.primitives.length - 1; i >= 0; i--) {
      const polygons: Polygon[] = [];
      partPrimitive.primitives[i].collectCsgPolygons(polygons);
      const b = Csg.fromPolygons(polygons);
/*
      const apolygons: Polygon[] = [];
      partPrimitive.primitives[i].collectCsgPolygons(apolygons);
      const a = Csg.fromPolygons(apolygons);
*/
      if (csg === null) {
        csg = b;
      } else {
        csg = csg.union(b);
      }
/*
      if (cb === null) {
        cb = a;
      } else {
        cb = cb.intersect(a);
      }*/
    }

    if (csg) { 
      //const d = csg.inverse();
      //csg = cb;//csg.intersect(cb);
      //csg = csg.inverse();
      //csg = csg.removeHiddenPolygons();
      csg = csg.skin();

      const geometry = csg.toGeometry();
      renderModel.add(geometry);
    }



    this.store.dispatch("document/setModel", { model: model });
    this.store.dispatch("document/setRenderModel", {
      renderModel: renderModel
    });
  }

  public get isDisabled(): boolean {
    return false;
  }
}
