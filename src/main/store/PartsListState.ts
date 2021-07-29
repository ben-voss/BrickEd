import PartInfo from "@/app/partIndex/PartInfo";
import { Module } from "vuex";
import MainState from "./MainState";
import fs from "fs";
import util from "util";
import Model from "@/app/files/Model";
import { Matrix4 } from "three";
import LdrModelLoader from "@/app/files/LdrModelLoader";
import LdrColor from "@/app/files/LdrColor";

const readFileAsync = util.promisify(fs.readFile);

export interface PartsListState {
  parts: PartInfo[];
  selectedPart: Model | null;
}

export default function partsListStateFactory(
  ldrModelLoader: LdrModelLoader
): Module<PartsListState, MainState> {
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
      async load(context): Promise<void> {
        const partsData = await readFileAsync("library/part-index.json");

        const parts = JSON.parse(partsData.toString());

        context.commit("setParts", parts);
      },
      async selectPart(
        context,
        args: { part: PartInfo; color: LdrColor }
      ): Promise<void> {
        await ldrModelLoader.load(args.part.f + ".dat");

        const model: Model = {
          file: "",
          commands: [
            {
              lineType: 1,
              color: { num: args.color.code },
              matrix: new Matrix4().identity(),
              file: args.part.f + ".dat"
            }
          ]
        };

        context.commit("setSelectedPart", model);
      }
    }
  };
}
