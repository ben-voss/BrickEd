<template>
  <div
    ref="dockingLayoutGroup"
    class="dockingLayoutGroup"
    v-bind:style="{
      width: width + '%',
      height: height + '%'
    }"
  >
    <template v-for="item in items">
      <DockingLayoutGroup
        v-bind:key="items.indexOf(item)"
        v-if="item.type === 'layoutGroup'"
        :orientation="item.orientation"
        :items="item.items"
        :width="item.width"
        :height="item.height"
        :isSizerVisible="item.isSizerVisible"
        :sizerPosition="item.sizerPosition"
      >
        <template v-for="(_, name) in $slots" v-slot:[name]="slotData"
          ><slot :name="name" v-bind="slotData"
        /></template>
      </DockingLayoutGroup>
      <DockingLayoutPanel
        v-bind:key="items.indexOf(item)"
        v-else-if="item.type === 'layoutPanel'"
        :title="item.title"
        :width="item.width"
        :height="item.height"
        :slotName="item.slot"
        :closeIsPressed="item.closeIsPressed"
        :onlyHaveOnePanel="onlyHaveOnePanel"
        class="dockingLayoutPanel"
        v-bind:style="{
          width: item.width + '%',
          height: item.height + '%'
        }"
      >
        <template v-for="(_, name) in $slots" v-slot:[name]="slotData"
          ><slot :name="name" v-bind="slotData"
        /></template>
      </DockingLayoutPanel>
      <DockingLayoutTab
        v-bind:key="items.indexOf(item)"
        v-else-if="item.type === 'layoutTab'"
        :width="item.width"
        :height="item.height"
        :items="item.items"
        :selectedItem="item.selectedItem"
      >
        <template v-for="(_, name) in $slots" v-slot:[name]="slotData"
          ><slot :name="name" v-bind="slotData"
        /></template>
      </DockingLayoutTab>
    </template>
    <div
      class="dockingLayoutResizerOverlay"
      v-bind:style="{
        display: isSizerVisible ? 'block' : 'none',
        left: orientation === 'horizontal' ? sizerPosition + 'px' : '0px',
        top: orientation === 'vertical' ? sizerPosition + 'px' : '0px',
        width: orientation === 'horizontal' ? '4px' : '100%',
        height: orientation === 'vertical' ? '4px' : '100%'
      }"
    ></div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { TabProps } from "./Props/TabProps";
import { GroupProps } from "./Props/GroupProps";
import { PanelProps } from "./Props/PanelProps";
import DockingLayoutPanel from "./DockingLayoutPanel.vue";
import DockingLayoutTab from "./DockingLayoutTab.vue";

@Options({
  components: {
    DockingLayoutPanel,
    DockingLayoutTab
  }
})
export default class DockingLayoutGroup extends Vue {
  @Prop({
    type: Array as () => Array<TabProps | GroupProps | PanelProps>,
    default: () => []
  })
  readonly items!: (TabProps | GroupProps | PanelProps)[];

  @Prop({
    type: String,
    default: "horizontal"
  })
  readonly orientation!: string;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly isSizerVisible!: boolean;

  @Prop({
    type: Number,
    default: 0
  })
  readonly sizerPosition!: number;

  @Prop({
    type: Number,
    default: 0
  })
  readonly width!: number;

  @Prop({
    type: Number,
    default: 0
  })
  readonly height!: number;

  @Prop({
    type: Boolean,
    default: false
  })
  readonly onlyHaveOnePanel!: boolean;
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.dockingLayoutGroup {
  display: block;
  position: relative;
  float: left;
  box-sizing: border-box;
  background-color: magenta;
}
.dockingLayoutPanel {
  display: block;
  position: relative;
  float: left;
}
.dockingLayoutResizerOverlay {
  display: none;
  position: relative;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0.5;
  box-sizing: border-box;
  border-color: $color-3;
  border-width: 0px;
  border-style: solid;
}
</style>
