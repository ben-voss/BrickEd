import LdrColor from "@/app/files/LdrColor";
import Model from "@/app/files/Model";
import PartInfo from "@/app/partIndex/PartInfo";
import { Module } from "vuex";
import MainState from "./MainState";

export interface DocumentState {
  isDirty: boolean;
  fileName: string | null;
  model: Model[];
  selectedPart: PartInfo[];
  selectedColor: LdrColor;
  modelCache: { [key: string]: Model };
}

export default function documentStateFactory(): Module<
  DocumentState,
  MainState
> {
  return {
    namespaced: true,
    state: {
      isDirty: false,
      fileName: null,
      model: [],
      selectedPart: [],
      selectedColor: { name: "", code: 4, value: 4, edge: 1 },
      modelCache: {}
    },
    mutations: {
      setFileName(state, fileName: string): void {
        state.fileName = fileName;
      },
      setIsDirty(state, isDirty: boolean): void {
        state.isDirty = isDirty;
      },
      setModel(state, model: Model[]): void {
        state.model = model;
      },
      addModelCache(state, args: { file: string; model: Model }): void {
        state.modelCache[args.file] = args.model;
      }
    },
    actions: {
      async setFileName(context, args: { fileName: string }): Promise<void> {
        context.commit("setFileName", args.fileName);
      },
      async setIsDirty(context, args: { isDirty: boolean }): Promise<void> {
        context.commit("setIsDirty", args.isDirty);
      },
      async setModel(context, args: { model: Model[] }): Promise<void> {
        context.commit("setModel", args.model);
      },
      async addModelCache(
        context,
        args: { file: string; model: Model }
      ): Promise<void> {
        context.commit("addModelCache", args);
      }
    }
  };
}
