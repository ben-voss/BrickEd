<template>
  <div class="border">
    <div class="toolbar">
      <button class="icon-button" v-on:click="setMode('select')">
        <svg-icon
          :class="mode === 'select' ? ['icon', 'icon-set'] : 'icon'"
          iconName="cursor-default-outline"
        />
      </button>
      <button class="icon-button" v-on:click="setMode('rotate')">
        <svg-icon
          :class="mode === 'rotate' ? ['icon', 'icon-set'] : 'icon'"
          iconName="rotate-orbit"
        />
      </button>
      <button class="icon-button" v-on:click="setMode('pan')">
        <svg-icon
          :class="mode === 'pan' ? ['icon', 'icon-set'] : 'icon'"
          iconName="cursor-move"
        />
      </button>
      <button class="icon-button" v-on:click="setMode('centre')">
        <svg-icon
          :class="mode === 'centre' ? ['icon', 'icon-set'] : 'icon'"
          iconName="cube-scan"
        />
      </button>
      <div class="button-seperator">|</div>
      <button class="icon-button" v-on:click="reset()">
        <svg-icon class="icon" iconName="cube-scan" />
      </button>
      <div class="button-seperator">|</div>
      <button class="icon-button" v-on:click="zoom(-1)">
        <svg-icon class="icon" iconName="magnify-minus-outline" />
      </button>
      <button class="icon-button" v-on:click="zoom(1)">
        <svg-icon class="icon" iconName="magnify-plus-outline" />
      </button>
      <div class="button-seperator">|</div>
      <button class="icon-button" v-on:click="snapToGrid()">
        <svg-icon class="icon" iconName="grid-snap" />
      </button>
      <button class="icon-button" v-on:click="setGrid('large')">
        <svg-icon
          :class="mode === 'centre' ? ['icon', 'icon-set'] : 'icon'"
          iconName="grid-large"
        />
      </button>
      <button class="icon-button" v-on:click="setGrid('medium')">
        <svg-icon
          :class="mode === 'centre' ? ['icon', 'icon-set'] : 'icon'"
          iconName="grid-medium"
        />
      </button>
      <button class="icon-button" v-on:click="setGrid('small')">
        <svg-icon
          :class="mode === 'centre' ? ['icon', 'icon-set'] : 'icon'"
          iconName="grid-small"
        />
      </button>
      <div class="button-seperator">|</div>
      <button class="icon-button" v-on:click="nudge(-1, 0)">
        <svg-icon class="icon" iconName="pan-left" />
      </button>
      <button class="icon-button" v-on:click="nudge(1, 0)">
        <svg-icon class="icon" iconName="pan-right" />
      </button>
      <button class="icon-button" v-on:click="nudge(0, -1)">
        <svg-icon class="icon" iconName="pan-up" />
      </button>
      <button class="icon-button" v-on:click="nudge(0, 1)">
        <svg-icon class="icon" iconName="pan-down" />
      </button>
      <div class="button-seperator">|</div>
      <button class="icon-button" v-on:click="rotate(0, 0, 1)">
        <svg-icon class="icon" iconName="axis-x-rotate-clockwise" />
      </button>
      <button class="icon-button" v-on:click="rotate(0, 0, -1)">
        <svg-icon class="icon" iconName="axis-x-rotate-counterclockwise" />
      </button>
      <button class="icon-button" v-on:click="rotate(1, 0, 0)">
        <svg-icon class="icon" iconName="axis-y-rotate-clockwise" />
      </button>
      <button class="icon-button" v-on:click="rotate(-1, 0, 0)">
        <svg-icon class="icon" iconName="axis-y-rotate-counterclockwise" />
      </button>
      <button class="icon-button" v-on:click="rotate(0, 1, 0)">
        <svg-icon class="icon" iconName="axis-z-rotate-clockwise" />
      </button>
      <button class="icon-button" v-on:click="rotate(0, -1, 0)">
        <svg-icon class="icon" iconName="axis-z-rotate-counterclockwise" />
      </button>
    </div>
    <div class="frame">
      <SplitPanel
        class="split"
        split-to="columns"
        :allow-resize="true"
        :size="50"
        units="percents"
      >
        <template v-slot:firstPanel>
          <CameraPanel
            :mode="mode"
            :grid="grid"
            v-on:gotFocus="handleFocus"
            :index="0"
            :angle="cameraStates[0].angle"
            v-model:zoom="cameraStates[0].zoom"
            :isActive="cameraStates[0].isActive"
          />
        </template>
        <template v-slot:secondPanel>
          <SplitPanel
            class="split"
            split-to="rows"
            :allow-resize="true"
            :size="50"
            units="percents"
          >
            <template v-slot:firstPanel>
              <CameraPanel
                :mode="mode"
                :grid="grid"
                v-on:gotFocus="handleFocus"
                :index="1"
                :angle="cameraStates[1].angle"
                v-model:zoom="cameraStates[1].zoom"
                :isActive="cameraStates[1].isActive"
              />
            </template>
            <template v-slot:secondPanel>
              <CameraPanel
                :mode="mode"
                :grid="grid"
                v-on:gotFocus="handleFocus"
                :index="2"
                :angle="cameraStates[2].angle"
                v-model:zoom="cameraStates[2].zoom"
                :isActive="cameraStates[2].isActive"
              />
            </template>
          </SplitPanel>
        </template>
      </SplitPanel>
    </div>
  </div>
</template>

<script lang="ts">
import CameraPanel, { GridSize, InteractionMode } from "./CameraPanel.vue";
import { IpcRendererEvent } from "electron";
import { Matrix4 } from "three";
import { Options, Vue } from "vue-class-component";
import SvgIcon from "./SvgIcon.vue";
import SplitPanel from "./SplitPanel/SplitPanel.vue";
import { Action, State } from "s-vuex-class";
import { Watch } from "vue-property-decorator";
import { LazyInject, Symbols } from "@/di";
import RenderModelFactory from "@/app/RenderModelFactory";
import RenderModel from "@/app/RenderModel";
import Model from "@/app/files/Model";

class CameraState {
  public angle: Matrix4;
  public zoom = 1;
  public isActive = false;

  constructor(angle: Matrix4) {
    this.angle = angle;
  }
}

@Options({
  components: {
    SplitPanel,
    CameraPanel,
    SvgIcon
  }
})
export default class SceneView extends Vue {
  // ** Non-reactive properties **
  // TODO: in vue3 use {markRaw}

  // ** Reactive Properties **
  private mode: InteractionMode = "select";
  private grid: GridSize = "medium";

  private focusedCamera!: CameraPanel;

  private cameraStates: CameraState[] = [
    new CameraState(CameraPanel.Angle3D),
    new CameraState(CameraPanel.AngleTop),
    new CameraState(CameraPanel.AngleRight)
  ];

  @LazyInject(Symbols.RenderModelFactory)
  readonly renderModelFactory!: RenderModelFactory;

  @State("model", { namespace: "document" })
  readonly model!: Model[];

  @Action("setRenderModel", { namespace: "render" })
  setRenderModel!: (args: { renderModel: RenderModel }) => void;

  @Watch("model", {
    immediate: true
  })
  private async handleModelChanged(newValue: Model[]): Promise<void> {
    var model = newValue[0];
    if (!model) {
      return;
    }

    const renderModel = await this.renderModelFactory.generate(model);
    this.setRenderModel({ renderModel: renderModel });
  }

  private handleFocus(cameraPanel: CameraPanel): void {
    this.focusedCamera = cameraPanel;

    for (let i = 2; i >= 0; i--) {
      this.cameraStates[i].isActive = cameraPanel.index === i;
    }
  }

  public setMode(mode: InteractionMode): void {
    this.mode = mode;
  }

  private reset(): void {
    this.focusedCamera.reset();
  }

  public zoom(dir: 1 | -1): void {
    const state = this.cameraStates[this.focusedCamera.index];
    state.zoom += dir * (state.zoom / 10);
  }

  public snapToGrid(): void {
    this.focusedCamera.snapToGrid();
  }

  public setGrid(grid: GridSize): void {
    this.grid = grid;
  }

  public rotate(x: 1 | 0 | -1, y: 1 | 0 | -1, z: 1 | 0 | -1): void {
    this.focusedCamera.rotate(x, y, z);
  }

  public delete(): void {
    this.focusedCamera.delete();
  }

  public nudge(x: number, y: number): void {
    this.focusedCamera.nudge(x, y);
  }

  public created(): void {
    this.initIpc();
  }

  private initIpc(): void {
    if (!(window as any).ipcRenderer) {
      return;
    }

    (window as any).ipcRenderer.on(
      "menu",
      (event: IpcRendererEvent, ...args: string[]) => {
        console.log(event);
        console.log(args);

        switch (args[0]) {
          case "orientation-3d-perspective": {
            this.cameraStates[this.focusedCamera.index].angle =
              CameraPanel.Angle3D;
            break;
          }
          case "orientation-front": {
            this.cameraStates[this.focusedCamera.index].angle =
              CameraPanel.AngleFront;
            break;
          }
          case "orientation-back": {
            this.cameraStates[this.focusedCamera.index].angle =
              CameraPanel.AngleBack;
            break;
          }
          case "orientation-top": {
            this.cameraStates[this.focusedCamera.index].angle =
              CameraPanel.AngleTop;
            break;
          }
          case "orientation-bottom": {
            this.cameraStates[this.focusedCamera.index].angle =
              CameraPanel.AngleBottom;
            break;
          }
          case "orientation-left": {
            this.cameraStates[this.focusedCamera.index].angle =
              CameraPanel.AngleLeft;
            break;
          }
          case "orientation-right": {
            this.cameraStates[this.focusedCamera.index].angle =
              CameraPanel.AngleRight;
            break;
          }
        }
      }
    );
  }
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.border {
  height: 100%;
  border: 1px solid $color-1;
  display: flex;
  flex-direction: column;
}

.toolbar {
  background-color: $color-4;
  flex-grow: 0;
  flex-shrink: 1;
  flex-basis: auto;
}

.frame {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
  border: 3px solid $color-4;
  position: relative;
}

.icon-button {
  border: none;
  background-color: $color-4;
  margin: 4px;
}
.icon-button:focus {
  outline: none;
}
.icon {
  width: 22px;
  height: 22px;
  color: $color-20;
}
.icon-set {
  color: $color-highlight-1;
}
.button-seperator {
  display: inline-block;
}
</style>
