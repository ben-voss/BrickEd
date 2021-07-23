import LdrColor from "@/app/files/LdrColor";
import Model from "@/app/files/Model";
import PartDrawList from "@/app/PartDrawList";
import PartInfo from "@/app/partIndex/PartInfo";
import RenderModel from "@/app/RenderModel";
import { Matrix4, Vector3 } from "three";
import { markRaw } from "vue";
import { Module } from "vuex";
import AppState from "../AppState";

export interface DocumentState {
  isDirty: boolean;
  fileName: string | null;
  model: Model[];
  renderModel: RenderModel | null;
  selection: PartDrawList[];
  selectionCentre: Vector3;
  selectedPart: PartInfo[];
  selectedColor: LdrColor;
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
      renderModel: null,
      selection: [],
      selectionCentre: markRaw(new Vector3()),
      selectedPart: [],
      selectedColor: { name: "", code: 4, value: 4, edge: 1 }
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
      setRenderModel(state, renderModel: RenderModel) {
        state.renderModel = markRaw(renderModel);
      },
      setSelection(state, parts: PartDrawList[]) {
        state.selection = markRaw(parts);

        if (!state.renderModel) {
          return;
        }

        state.renderModel.selectedParts = state.selection;

        // Record the position of the first item in the selection.  This is used
        // when adding a new part to the model
        if (parts.length > 0) {
          state.selectionCentre.setFromMatrixPosition(parts[0].matrix);
        }

        // Poke the render model to re-draw
        state.renderModel.updateSelection();
      },
      moveParts(state, args: { parts: PartDrawList[]; matrix: Matrix4 }): void {
        if (!state.renderModel) {
          return;
        }
        state.renderModel.moveParts(args.parts, args.matrix);

        // Record the position of the first item in the selection.  This is used
        // when adding a new part to the model
        if (state.selection.length > 0) {
          state.selectionCentre.setFromMatrixPosition(
            state.selection[0].matrix
          );
        }
      },
      removeParts(state, parts: PartDrawList[]) {
        // Remove the parts from the selection
        const selectedParts = state.selection;
        if (selectedParts) {
          for (const part of parts) {
            const i = selectedParts.indexOf(part);
            if (i >= 0) {
              selectedParts.splice(i, 1);
            }
          }
        }

        if (!state.renderModel) {
          return;
        }

        state.renderModel.deleteParts(parts);
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
      async setRenderModel(
        context,
        args: { renderModel: RenderModel }
      ): Promise<void> {
        context.commit("setRenderModel", args.renderModel);
      },
      async setSelection(
        context,
        args: { parts: PartDrawList[] }
      ): Promise<void> {
        context.commit("setSelection", args.parts);
      },
      async moveParts(
        context,
        args: { parts: PartDrawList[]; matrix: Matrix4 }
      ): Promise<void> {
        context.commit("moveParts", args);
      },
      async removeParts(
        context,
        args: { parts: PartDrawList[] }
      ): Promise<void> {
        context.commit("removeParts", args.parts);
      }
    }
  };
}
