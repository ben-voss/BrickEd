import LdrColor from "@/app/files/LdrColor";
import Model from "@/app/files/Model";
import PartInfo from "@/app/partIndex/PartInfo";
import { Module } from "vuex";
import AppState from "../AppState";

export interface PartsListState {
  parts: PartInfo[];
  selectedPart: Model | null;
}

export default function partsListStateFactory(): Module<
  PartsListState,
  AppState
> {
  return {
    namespaced: true,
    state: {
      parts: [],
      selectedPart: null
    },
    mutations: {
      setParts(state, parts: PartInfo[]): void {
        state.parts = parts;
      },
      setSelectedPart(state, part: Model): void {
        state.selectedPart = part;
      }
    },
    actions: {
      load(context): void {
        //
      },
      selectPart(context, args: { part: PartInfo; color: LdrColor }): void {
        //
      }
    }
  };
}
