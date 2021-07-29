import PartDrawList from "@/app/PartDrawList";
import RenderModel from "@/app/RenderModel";
import { Matrix4, Vector3 } from "three";
import { markRaw } from "vue";
import { Module } from "vuex";
import AppState from "../AppState";

export interface RenderState {
  renderModel: RenderModel | null;
  selection: PartDrawList[];
  selectionCentre: Vector3;
}

export default function renderStateFactory(): Module<RenderState, AppState> {
  return {
    namespaced: true,
    state: {
      renderModel: null,
      selection: [],
      selectionCentre: markRaw(new Vector3())
    },
    mutations: {
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
      async setRenderModel(
        context,
        args: { renderModel: RenderModel }
      ): Promise<void> {
        context.commit("setRenderModel", args.renderModel);
      }
    }
  };
}
