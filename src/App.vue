<template>
  <div style="position: relative; height: 28px">
    <div
      class="titlebar"
      style="
        background-color: rgb(32, 46, 58);
        color: rgb(204, 204, 204);
        width: 100%;
        height: 28px;
      "
    >
      <div class="titlebar-drag-region"></div>
      <div
        class="window-title"
        style="
          zoom: 1;
          position: absolute;
          left: 50%;
          transform: translate(-50%, 0px);
          max-width: calc(100vw - 160px);
        "
      ></div>
    </div>
  </div>
  <div
    v-on:ccontextMenu="$event.preventDefault()"
    style="height: calc(100vh - 28px)"
  >
    <dockingLayout :config="config">
      <template v-slot:HelloWorld>
        <HelloWorld />
      </template>
      <template v-slot:ModelPanel>
        <ModelPanel />
      </template>
      <template v-slot:ModelView>
        <ModelView />
      </template>
      <template v-slot:PartLibraryPanel>
        <PartLibraryPanel />
      </template>
    </dockingLayout>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import HelloWorld from "./components/HelloWorld.vue";
import DockingLayout from "./components/DockingLayout/DockingLayout.vue";
import ModelPanel from "./components/ModelPanel.vue";
import ModelView from "./components/ModelView/ModelView.vue";
import PartLibraryPanel from "./components/PartLibrary/PartLibraryPanel.vue";

@Options({
  components: {
    DockingLayout,
    HelloWorld,
    ModelPanel,
    ModelView,
    PartLibraryPanel
  }
})
export default class App extends Vue {
  config = {
    group: {
      type: "layoutGroup",
      orientation: "horizontal",
      items: [
        {
          type: "layoutPanel",
          title: "Model",
          width: 10,
          slot: "ModelView"
        },
        {
          type: "layoutGroup",
          orientation: "vertical",
          width: 90,
          items: [
            {
              type: "layoutGroup",
              orientation: "horizontal",
              height: 85,
              items: [
                {
                  type: "layoutPanel",
                  title: "Model",
                  width: 75,
                  slot: "ModelPanel"
                },
                {
                  type: "layoutPanel",
                  title: "Parts Library",
                  slot: "PartLibraryPanel",
                  width: 25
                }
              ]
            },
            {
              type: "layoutPanel",
              title: "Panel D",
              height: 15,
              slot: "HelloWorld"
            }
          ]
        }
      ]
    }
  };

  async beforeMount(): Promise<void> {
    var argv = (window as any).argv as string;
    console.log(argv);

    const layoutConfigIndex = argv.indexOf("--layoutConfig");
    if (layoutConfigIndex > -1) {
      this.config = JSON.parse(argv[layoutConfigIndex + 1]);
    }

    // Indicate to the main process that the window is ready to receive IPC messages.
    window.ipcRenderer.send("READY");
  }
}
</script>

<style lang="scss">
@import "@/styles/color.scss";
* {
  user-select: none;
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: small;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.titlebar {
  box-sizing: border-box;
  padding: 0 70px;
  overflow: hidden;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  zoom: 1;
  line-height: 22px;
  height: 22px;
  width: 100%;
  display: flex;
  position: absolute;
}
.titlebar > .titlebar-drag-region {
  top: 0;
  left: 0;
  display: block;
  position: absolute;
  width: 100%;
  height: 100%;
  -webkit-app-region: drag;
}
.titlebar > .window-title {
  flex: 0 1 auto;
  font-size: 12px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-left: auto;
  margin-right: auto;
}
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-button {
  width: 5px;
  height: 5px;
}
::-webkit-scrollbar-corner {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: $highlight-color;
  border: 0px solid transparent;
  border-radius: 50px;
}
::-webkit-scrollbar-track {
  background: $panel-background;
  border: 0px none #ffffff;
  border-radius: 53px;
}
</style>
