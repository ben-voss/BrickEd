import LdrColor from "@/app/files/LdrColor";
import Model from "@/app/files/Model";
import PartInfo from "@/app/partIndex/PartInfo";
import { Module } from "vuex";
import AppState from "../AppState";

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
  AppState
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
    }
  };
}
