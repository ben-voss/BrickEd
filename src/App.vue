<template>
  <div v-on:contextMenu="$event.preventDefault()">
    <dockingLayout :config="config">
      <template v-slot:HelloWorld>
        <HelloWorld />
      </template>
      <template v-slot:HiThere>
        <HiThere />
      </template>
    </dockingLayout>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import HelloWorld from "./components/HelloWorld.vue";
import HiThere from "./components/HiThere.vue";
import DockingLayout from "./components/DockingLayout/DockingLayout.vue";

@Options({
  components: {
    DockingLayout,
    HelloWorld,
    HiThere
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
                  title: "Panel B",
                  width: 75,
                  slot: "HelloWorld"
                },
                {
                  type: "layoutPanel",
                  title: "Panel C",
                  slot: "HiThere",
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
