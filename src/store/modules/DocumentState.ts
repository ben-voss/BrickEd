import Model from "@/app/files/Model";
import { Module } from "vuex";
import AppState from "../AppState";

export interface DocumentState {
  dirty: boolean;
  fileName: string | null;
  model: Model[];
}

export default function documentStateFactory(): Module<
  DocumentState,
  AppState
> {
  return {
    namespaced: true,
    state: {
      dirty: false,
      fileName: null,
      model: []
    },
    mutations: {
      setFileName(state, fileName: string): void {
        state.fileName = fileName;
      },
      setIsDirty(state, dirty: boolean): void {
        state.dirty = dirty;
      },
      setModel(state, model: Model[]): void {
        state.model = model;
      }
    },
    actions: {
      async setFileName(context, args: { fileName: string }): Promise<void> {
        context.commit("setFileName", args.fileName);
      },
      async setIsDirty(context, args: { isDirty: boolean }): Promise<void> {
        context.commit("isDirty", args.isDirty);
      },
      async setModel(context, args: { model: Model[] }): Promise<void> {
        context.commit("setModel", args.model);
      }
    }
  };
}
