import Api from "@/api/Api";
import PartInfo from "@/app/partIndex/PartInfo";
import { Module } from "vuex";
import AppState from "../AppState";

export interface PartsListState {
  parts: PartInfo[];
}

export default function partsListStateFactory(
  api: Api
): Module<PartsListState, AppState> {
  return {
    namespaced: true,
    state: {
      parts: []
    },
    mutations: {
      setParts(state, parts: PartInfo[]): void {
        state.parts = parts;
      }
    },
    actions: {
      async load(context): Promise<void> {
        const partsData = await api.readFileAsync("library/part-index.json");

        const parts = JSON.parse(partsData);

        context.commit("setParts", parts);
      }
    }
  };
}
