<template>
  <div
    class="dockingLayoutTab"
    v-bind:style="{
      width: width + '%',
      height: height + '%'
    }"
  >
    <DockingLayoutTabItem
      v-for="item in items"
      v-bind:key="'t' + items.indexOf(item)"
      :title="item.title"
      v-model:width="item.itemWidth"
      :isSelected="item === selectedItem"
    >
    </DockingLayoutTabItem>
    <div
      v-for="item in items"
      v-bind:key="'p' + items.indexOf(item)"
      :class="
        item === selectedItem
          ? 'dockingLayoutPanel-selected'
          : 'dockingLayoutPanel'
      "
      :style="{ display: item === selectedItem ? 'block' : 'none' }"
    >
      <slot :name="item.slot" />
    </div>
  </div>
</template>

<script lang="ts">
import { Options, Vue } from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { PanelProps } from "./Props/PanelProps";
import DockingLayoutTabItem from "./DockingLayoutTabItem.vue";

@Options({
  components: {
    DockingLayoutTabItem
  }
})
export default class DockingLayoutTab extends Vue {
  @Prop({
    type: Array as () => Array<PanelProps>,
    default: () => []
  })
  readonly items!: PanelProps[];

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
    type: Object as () => PanelProps,
    default: null
  })
  readonly selectedItem!: PanelProps;
}
</script>

<style lang="scss" scoped>
@import "@/styles/color.scss";

.dockingLayoutTab {
  display: block;
  position: relative;
  float: left;
  box-sizing: border-box;
  border-color: $color-1;
  border-width: 1px;
  border-style: solid;
  background-color: $color-3;
}
.dockingLayoutTabHeader {
  position: relative;
  display: block;
  float: left;
  color: #aaaaaa;
  background-color: $color-2;
  border: 1px solid $color-1;
  font-family: sans-serif;
  font-size: small;
  padding: 2px 2px 2px 4px;
  white-space: nowrap;
  border: 1px solid $color-1;
  overflow: hidden;
  height: 16px;
}
.dockingLayoutTabHeader-selected {
  position: relative;
  display: block;
  float: left;
  color: #aaaaaa;
  background-color: $color-4;
  border: 1px solid $color-1;
  font-family: sans-serif;
  font-size: small;
  padding: 2px 2px 2px 4px;
  white-space: nowrap;
  border: 1px solid $color-1;
  overflow: hidden;
  height: 16px;
}
.dockingLayoutPanel {
  display: none;
  position: relative;
  float: left;
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
}
.dockingLayoutPanel-selected {
  display: block;
  position: relative;
  float: left;
  width: 100%;
  height: 100%;
  left: 0px;
  top: 0px;
}
</style>
