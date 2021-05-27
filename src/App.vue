<template>
  <div v-on:ccontextMenu="$event.preventDefault()">
    <dockingLayout :config="config">
      <template v-slot:HelloWorld>
        <HelloWorld />
      </template>
      <template v-slot:ModelPanel>
        <ModelPanel />
      </template>
    </dockingLayout>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import HelloWorld from "./components/HelloWorld.vue";
import DockingLayout from "./components/DockingLayout/DockingLayout.vue";
import { LazyInject, Symbols } from "./di";
import LdrColorLoader from "./app/files/LdrColorLoader";
import ModelPanel from "./components/ModelPanel.vue";

@Options({
  components: {
    DockingLayout,
    HelloWorld,
    ModelPanel
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
          title: "Panel A",
          width: 10,
          slot: "HelloWorld"
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
                  title: "Panel C",
                  slot: "HelloWorld",
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

  @LazyInject(Symbols.LdrColorLoader)
  private ldrColorLoader!: LdrColorLoader;

  async beforeMount(): Promise<void> {
    // Indicate to the main process that the window is ready to receive IPC messages.
    window.ipcRenderer.send("READY");
  }
}
</script>

<style lang="scss">
@import "@/styles/color.scss";
* {
  user-select: none;
  font-family: sans-serif;
  font-size: small;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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
  background: $color-highlight-1;
  border: 0px solid transparent;
  border-radius: 50px;
}
::-webkit-scrollbar-track {
  background: $color-2;
  border: 0px none #ffffff;
  border-radius: 53px;
}
</style>
